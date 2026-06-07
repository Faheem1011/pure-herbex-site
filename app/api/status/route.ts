import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone } from "@/lib/blocked";
import { sendWhatsAppMediaMessage } from "@/lib/whatsapp-send";

export const maxDuration = 60;

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


async function getAllLeadPhones(): Promise<string[]> {
  const active: string[] = await kv.smembers("whatsapp:active_contacts");
  let fromFile: string[] = [];
  try {
    const file = path.join(process.cwd(), "public", "contacts.json");
    const data = JSON.parse(await readFile(file, "utf-8")) as { phone: string }[];
    fromFile = data.map((c) => normalizePhone(c.phone));
  } catch {
    fromFile = [];
  }
  return [...new Set([...active.map(normalizePhone), ...fromFile])].filter(Boolean);
}

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
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: add a new status item (image/video via Meta mediaId)
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, mediaId, caption, notifyContacts = true } = await request.json();
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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pure-herbex-site.vercel.app");
    const statusPageUrl = `${siteUrl.replace(/\/$/, "")}/status/`;

    let broadcast = { sent: 0, failed: 0, skipped: 0 };
    if (notifyContacts) {
      const phones = await getAllLeadPhones();
      const statusCaption = [
        caption || "New update from Pure Herbex!",
        `View all updates: ${statusPageUrl}`,
      ].filter(Boolean).join("\n\n");

      for (const phone of phones) {
        if (await isPhoneBlocked(phone)) {
          broadcast.skipped++;
          continue;
        }
        const result = await sendWhatsAppMediaMessage(phone, type, mediaId, statusCaption);
        if (result.ok) broadcast.sent++;
        else broadcast.failed++;
      }
    }

    return NextResponse.json({ status: "success", item, broadcast, statusPageUrl });
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
