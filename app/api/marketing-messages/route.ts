import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone } from "@/lib/blocked";
import { isVoiceNoteFile } from "@/lib/meta-media";
import { getWhatsAppAccessToken, getWhatsAppPhoneNumberId, WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";
import { bumpInboxVersion } from "@/lib/inbox-sync";
import {
  getAllMarketingContacts,
  getMarketingContact,
  saveMarketingContact,
} from "@/lib/marketing-inbox";

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await getAllMarketingContacts();
    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toPhone, replyText, contactName, type, mediaId, location, fileName, replyTo, isVoiceNote } =
      await request.json();

    if (!toPhone) {
      return NextResponse.json({ error: "Missing recipient phone number" }, { status: 400 });
    }

    const phone = normalizePhone(toPhone);
    if (await isPhoneBlocked(phone)) {
      return NextResponse.json({ error: "This contact is blocked." }, { status: 403 });
    }

    const msgType = type || "text";
    if (msgType === "text" && !replyText) {
      return NextResponse.json({ error: "Missing text content" }, { status: 400 });
    }

    const sendAsVoice =
      msgType === "audio" &&
      (!!isVoiceNote ||
        (!!fileName && isVoiceNoteFile({ name: fileName, type: "audio/ogg" })));

    const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${getWhatsAppPhoneNumberId()}/messages`;
    const messagePayload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: msgType,
    };

    if (replyTo) messagePayload.context = { message_id: replyTo };

    if (msgType === "text") {
      messagePayload.text = { preview_url: false, body: replyText };
    } else if (msgType === "image") {
      messagePayload.image = { id: mediaId };
    } else if (msgType === "audio") {
      messagePayload.audio = sendAsVoice
        ? { id: mediaId, voice: true }
        : { id: mediaId };
    } else if (msgType === "video") {
      messagePayload.video = { id: mediaId };
    } else if (msgType === "document") {
      messagePayload.document = { id: mediaId, filename: fileName || "Document" };
    } else if (msgType === "location") {
      messagePayload.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name || "Location",
        address: location.address || "",
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getWhatsAppAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    const respData = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: respData.error?.message || "Failed to send message" },
        { status: 400 }
      );
    }

    const msgId = respData.messages?.[0]?.id || "N/A";
    let contact = await getMarketingContact(phone);
    if (!contact) {
      contact = { name: contactName || "Lead", phone, messages: [] };
    }

    let displayLogText = replyText || "";
    if (msgType === "image") displayLogText = "📷 Photo";
    else if (msgType === "audio") displayLogText = sendAsVoice ? "🎤 Voice Note" : "🎵 Audio";
    else if (msgType === "video") displayLogText = "🎥 Video";
    else if (msgType === "document") displayLogText = fileName ? `📄 File: ${fileName}` : "📄 File";
    else if (msgType === "location") {
      displayLogText = location?.name ? `📍 Location: ${location.name}` : "📍 Location";
    }

    contact.messages.push({
      id: msgId,
      sender: "me",
      text: displayLogText,
      timestamp: Math.floor(Date.now() / 1000),
      status: "sent",
      type: sendAsVoice ? "voice" : msgType,
      mediaId: mediaId || undefined,
      replyTo: replyTo || undefined,
      location: location || undefined,
      fileName: fileName || undefined,
      isVoiceNote: sendAsVoice || undefined,
    });

    await saveMarketingContact(contact);
    await bumpInboxVersion();
    return NextResponse.json({ status: "success", msgId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, markRead, promoteToMain } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const contact = await getMarketingContact(normalized);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (markRead) {
      contact.hasUnread = false;
      contact.unreadCount = 0;
      await saveMarketingContact(contact);
    }

    if (promoteToMain) {
      let main: any = await kv.get(`whatsapp:contact:${normalized}`);
      if (!main) {
        main = { ...contact, hasUnread: false, unreadCount: 0 };
      } else {
        const ids = new Set(main.messages.map((m: any) => m.id));
        for (const msg of contact.messages) {
          if (!ids.has(msg.id)) main.messages.push(msg);
        }
        if (contact.name && main.name === "WhatsApp Contact") main.name = contact.name;
      }
      await kv.set(`whatsapp:contact:${normalized}`, main);
      await kv.sadd("whatsapp:active_contacts", normalized);
      await kv.srem("whatsapp:marketing_contacts", normalized);
      await kv.del(`whatsapp:marketing_contact:${normalized}`);
      await bumpInboxVersion();
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    await kv.srem("whatsapp:marketing_contacts", normalized);
    await kv.del(`whatsapp:marketing_contact:${normalized}`);
    await bumpInboxVersion();
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
