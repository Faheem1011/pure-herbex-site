import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
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

    // Fetch existing contact or create a new one to tag
    let contact: any = await kv.get(`whatsapp:contact:${phone}`);
    if (!contact) {
      contact = {
        name: "WhatsApp Contact",
        phone: phone,
        messages: [],
      };
    }

    // Update the tag (e.g., "Confirm", "Potential", "Important", "Spam", or null/empty)
    contact.tag = tag || null;

    await kv.set(`whatsapp:contact:${phone}`, contact);
    await kv.sadd("whatsapp:active_contacts", phone);
    await bumpInboxVersion();

    return NextResponse.json({ status: "success", tag: contact.tag });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
