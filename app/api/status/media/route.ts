import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { publicCorsPreflight, withPublicCors } from "@/lib/public-cors";
import {
  getStatusMedia,
  isActiveStatusMedia,
  storeStatusMedia,
} from "@/lib/status-storage";

const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return publicCorsPreflight();
}

/** Upload status media (stored on Vercel KV — not Meta). */
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const id = await storeStatusMedia(bytes, file.type, STATUS_TTL_MS);

    const isVideo =
      file.type.startsWith("video/") || /\.(mp4|mov|m4v|3gp|webm)$/i.test(file.name);

    return NextResponse.json({
      status: "success",
      mediaId: id,
      type: isVideo ? "video" : "image",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Public read for active status media. */
export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    const authed = isInboxAuthed(request);
    const isPublic = await isActiveStatusMedia(id);
    if (!authed && !isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await getStatusMedia(id);
    if (!media) {
      return NextResponse.json({ error: "Status media not found or expired" }, { status: 404 });
    }

    const response = new NextResponse(new Uint8Array(media.bytes), {
      status: 200,
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
    return isPublic ? withPublicCors(response) : response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
