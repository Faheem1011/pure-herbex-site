import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { prepareMetaUploadFile } from "@/lib/meta-media";
import { isKnownInboxMedia, registerKnownMediaId } from "@/lib/media-index";
import { publicCorsPreflight, withPublicCors } from "@/lib/public-cors";
import { isPublicStatusMedia } from "@/lib/status-media";
import { getWhatsAppAccessToken, WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";
import { getWhatsAppPhoneNumberIdForLine } from "@/lib/inbox-line";
import { resolveInboxLine } from "@/lib/inbox-request";

export async function OPTIONS() {
  return publicCorsPreflight();
}

const MAX_VIDEO_BYTES = 16 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Increase timeout to 60 seconds for larger media uploads

// 1. GET: Fetch media from Meta and proxy it to bypass authentication and CORS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    const authed = isInboxAuthed(request);
    const isPublic = await isPublicStatusMedia(mediaId);
    const allowed =
      authed ||
      isPublic ||
      (await isKnownInboxMedia(mediaId));
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step A: Get Meta Media Download URL
    const metaUrl = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${mediaId}`;
    const infoRes = await fetch(metaUrl, {
      headers: {
        Authorization: `Bearer ${getWhatsAppAccessToken()}`,
      },
    });

    if (!infoRes.ok) {
      const errorData = await infoRes.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to retrieve media metadata" },
        { status: infoRes.status }
      );
    }

    const mediaInfo = await infoRes.json();
    const downloadUrl = mediaInfo.url;

    if (!downloadUrl) {
      return NextResponse.json({ error: "No download URL returned from Meta" }, { status: 404 });
    }

    // Step B: Download binary content from Meta
    const mediaRes = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${getWhatsAppAccessToken()}`,
      },
    });

    if (!mediaRes.ok) {
      return NextResponse.json({ error: "Failed to download media bytes" }, { status: mediaRes.status });
    }

    // Step C: Stream binary response to client with correct content-type
    const contentType = mediaRes.headers.get("content-type") || "application/octet-stream";
    const mediaBuffer = await mediaRes.arrayBuffer();

    const response = new NextResponse(mediaBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24h
      },
    });
    return isPublic ? withPublicCors(response) : response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Upload file to Meta WhatsApp Media Endpoint
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const line = resolveInboxLine(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sendAs = (formData.get("sendAs") as string) || "auto";
    const voiceNote = formData.get("voiceNote") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const prepared = prepareMetaUploadFile(file, {
      sendAs: sendAs === "document" || sendAs === "video" ? sendAs : "auto",
      voiceNote,
    });

    if (prepared.category === "document" && file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: "File exceeds WhatsApp's 100 MB document limit." },
        { status: 400 }
      );
    }
    if (prepared.category === "video" && file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Video exceeds WhatsApp's 16 MB limit. Compress the file or send a shorter clip." },
        { status: 400 }
      );
    }
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "File is over 4.5 MB — the server upload limit. Compress your video (under 4 MB) before sending.",
        },
        { status: 413 }
      );
    }

    const metaFormData = new FormData();
    metaFormData.append("messaging_product", "whatsapp");
    metaFormData.append("file", prepared.blob, prepared.filename);
    metaFormData.append("type", prepared.category);

    const uploadUrl = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${getWhatsAppPhoneNumberIdForLine(line)}/media`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getWhatsAppAccessToken()}`,
      },
      body: metaFormData,
    });

    const data = await response.json();

    if (response.ok && data.id) {
      await registerKnownMediaId(data.id, line);
      return NextResponse.json({
        status: "success",
        mediaId: data.id,
        category: prepared.category,
        filename: prepared.filename,
      });
    } else {
      const errorMsg = data.error?.message || "Failed to upload media to Meta API";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
