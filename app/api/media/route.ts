import { NextRequest, NextResponse } from "next/server";

const accessToken = "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD";
const phoneNumberId = "1098694096667377";

// 1. GET: Fetch media from Meta and proxy it to bypass authentication and CORS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("id");

    if (!mediaId) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    // Step A: Get Meta Media Download URL
    const metaUrl = `https://graph.facebook.com/v20.0/${mediaId}`;
    const infoRes = await fetch(metaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mediaRes.ok) {
      return NextResponse.json({ error: "Failed to download media bytes" }, { status: mediaRes.status });
    }

    // Step C: Stream binary response to client with correct content-type
    const contentType = mediaRes.headers.get("content-type") || "application/octet-stream";
    const mediaBuffer = await mediaRes.arrayBuffer();

    return new NextResponse(mediaBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24h
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Upload file to Meta WhatsApp Media Endpoint
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (sessionToken !== "PureHerbex2026!") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Prepare Multipart form-data for Meta
    const metaFormData = new FormData();
    metaFormData.append("messaging_product", "whatsapp");
    metaFormData.append("file", file, file.name);
    metaFormData.append("type", file.type);

    const uploadUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/media`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: metaFormData,
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return NextResponse.json({ status: "success", mediaId: data.id });
    } else {
      const errorMsg = data.error?.message || "Failed to upload media to Meta API";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
