import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { normalizePhone } from "@/lib/blocked";
import { bumpInboxVersion } from "@/lib/inbox-sync";
import { activeContactsKey, contactKey } from "@/lib/kv-keys";
import { PRODUCTION_INBOX_URL } from "@/lib/inbox-public-url";
import { recomputeUnread, type ReadableContact } from "@/lib/read-state";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://pureherbex.com",
  "https://www.pureherbex.com",
  PRODUCTION_INBOX_URL,
  "http://localhost:3000",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://pureherbex.com";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body: object, status: number, origin: string | null) {
  return NextResponse.json(body, { status, headers: corsHeaders(origin) });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();
    const { name, phone, message, company } = body as {
      name?: string;
      phone?: string;
      message?: string;
      company?: string;
    };

    // Honeypot — bots fill hidden fields
    if (company) {
      return json({ status: "success" }, 200, origin);
    }

    const trimmedName = (name || "").trim().slice(0, 80);
    const trimmedMessage = (message || "").trim().slice(0, 2000);
    const normalized = normalizePhone(phone || "");

    if (!trimmedName) {
      return json({ error: "Please enter your name." }, 400, origin);
    }
    if (!normalized || normalized.length < 10) {
      return json({ error: "Please enter a valid Pakistani phone number." }, 400, origin);
    }
    if (!trimmedMessage) {
      return json({ error: "Please tell us how we can help." }, 400, origin);
    }

    const line = "main" as const;
    const storageKey = contactKey(line, normalized);
    let contact: {
      name: string;
      phone: string;
      messages: Array<Record<string, unknown>>;
      tag?: string;
      unreadCount?: number;
      hasUnread?: boolean;
    } | null = await kv.get(storageKey);

    if (!contact) {
      contact = { name: trimmedName, phone: normalized, messages: [] };
    } else {
      if (!contact.messages) contact.messages = [];
      if (trimmedName && contact.name === "WhatsApp Contact") {
        contact.name = trimmedName;
      }
    }

    const msgId = `webform-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const displayText = `📋 Website contact form\n\n${trimmedMessage}`;

    contact.messages.push({
      id: msgId,
      sender: "them",
      text: displayText,
      timestamp: Math.floor(Date.now() / 1000),
      status: "received",
      type: "website_form",
      readByAgent: false,
    });

    if (!contact.tag) {
      contact.tag = "Potential";
    }

    recomputeUnread(contact as unknown as ReadableContact);
    contact.phone = normalized;

    await kv.set(storageKey, contact);
    await kv.sadd(activeContactsKey(line), normalized);
    await bumpInboxVersion(line);

    return json(
      {
        status: "success",
        message: "Received! We will reply on WhatsApp shortly.",
        whatsappUrl: `https://wa.me/923160924151?text=${encodeURIComponent(
          `Assalam o Alaikum, I submitted the contact form. My name is ${trimmedName}.`
        )}`,
      },
      200,
      origin
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Could not submit form";
    return json({ error: msg }, 500, origin);
  }
}
