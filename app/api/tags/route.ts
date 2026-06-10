import { NextRequest, NextResponse } from "next/server";

import { kv } from "@vercel/kv";

import { isInboxAuthed } from "@/lib/auth";

import { normalizePhone } from "@/lib/blocked";

import { bumpInboxVersion } from "@/lib/inbox-sync";



export async function POST(request: NextRequest) {

  try {

    if (!isInboxAuthed(request)) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const { phone, tag } = await request.json();



    if (!phone) {

      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });

    }



    const normalized = normalizePhone(phone);

    if (!normalized) {

      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

    }



    let contact: { name: string; phone: string; messages: unknown[]; tag?: string | null } | null =

      await kv.get(`whatsapp:contact:${normalized}`);

    if (!contact) {

      contact = {

        name: "WhatsApp Contact",

        phone: normalized,

        messages: [],

      };

    }



    contact.tag = tag || null;

    contact.phone = normalized;



    await kv.set(`whatsapp:contact:${normalized}`, contact);

    await kv.sadd("whatsapp:active_contacts", normalized);

    await bumpInboxVersion();



    return NextResponse.json({ status: "success", tag: contact.tag });

  } catch (error: unknown) {

    const message = error instanceof Error ? error.message : "Tag update failed";

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

