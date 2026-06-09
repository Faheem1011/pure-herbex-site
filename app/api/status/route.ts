import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { registerPublicStatusMedia } from "@/lib/status-media";
import { publicCorsPreflight, withPublicCors } from "@/lib/public-cors";
import { getStatusPublicPageUrl } from "@/lib/site-urls";

export async function OPTIONS() {
  return publicCorsPreflight();
}

const STATUS_KEY = "whatsapp:status_items";
const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

export type StatusItem = {
  id: string;
  type: "image" | "video";
  mediaId: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
};

async function getActiveItems(): Promise<StatusItem[]> {
  const items: StatusItem[] = (await kv.get(STATUS_KEY)) || [];
  const now = Date.now();
  const active = items.filter((item) => item.expiresAt > now);
  if (active.length !== items.length) {
    await kv.set(STATUS_KEY, active);
  }
  return active.sort((a, b) => b.createdAt - a.createdAt);
}

// GET: list active status items (public or authed)
export async function GET(request: NextRequest) {
  try {
    const isPublic = new URL(request.url).searchParams.get("public") === "1";
    if (!isPublic && !isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await getActiveItems();
    const response = NextResponse.json({ items, statusPageUrl: getStatusPublicPageUrl() });
    return isPublic ? withPublicCors(response) : response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: publish a status item (web viewer only — separate from marketing templates)
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, mediaId, caption } = await request.json();
    if (!mediaId || !["image", "video"].includes(type)) {
      return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
    }

    const now = Date.now();
    const item: StatusItem = {
      id: `status_${now}`,
      type,
      mediaId,
      caption: caption || "",
      createdAt: now,
      expiresAt: now + STATUS_TTL_MS,
    };

    const items = await getActiveItems();
    items.unshift(item);
    await kv.set(STATUS_KEY, items.slice(0, 30));
    if (!mediaId.startsWith("st_")) {
      await registerPublicStatusMedia(mediaId);
    }

    const statusPageUrl = getStatusPublicPageUrl();

    return NextResponse.json({ status: "success", item, statusPageUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: remove a status item
export async function DELETE(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing status id" }, { status: 400 });
    }

    const items: StatusItem[] = (await kv.get(STATUS_KEY)) || [];
    await kv.set(STATUS_KEY, items.filter((item) => item.id !== id));

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
