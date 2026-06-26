import { NextRequest, NextResponse } from "next/server";

import { kv } from "@/lib/kv";

import { isInboxAuthed } from "@/lib/auth";

import { normalizePhone } from "@/lib/blocked";

import { bumpInboxVersion } from "@/lib/inbox-sync";

import { resolveInboxLine } from "@/lib/inbox-request";

import { VALID_TAG_IDS } from "@/app/inbox/constants";
import { activeContactsKey, contactKey } from "@/lib/kv-keys";
import { notifyMetaContactTagged } from "@/lib/meta-lead-quality";

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const { phone, tag } = body;

    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const nextTag =
      tag && VALID_TAG_IDS.has(tag) ? tag : null;

    const storageKey = contactKey(line, normalized);
    let contact: {
      name: string;
      phone: string;
      messages: unknown[];
      tag?: string | null;
      adReferral?: { ctwaClid?: string; sourceId?: string; sourceType?: string };
    } | null = await kv.get(storageKey);

    if (!contact) {
      contact = {
        name: "WhatsApp Contact",
        phone: normalized,
        messages: [],
      };
    }

    contact.tag = nextTag;
    contact.phone = normalized;

    await kv.set(storageKey, contact);
    await kv.sadd(activeContactsKey(line), normalized);
    await bumpInboxVersion(line);

    if (nextTag) {
      void notifyMetaContactTagged({
        phone: normalized,
        name: contact.name,
        tag: nextTag,
        adReferral: contact.adReferral,
      });
    }

    return NextResponse.json({ status: "success", tag: contact.tag, phone: normalized });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Tag update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
