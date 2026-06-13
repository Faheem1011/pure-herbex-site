import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone } from "@/lib/blocked";
import { getWhatsAppPhoneNumberIdForLine } from "@/lib/inbox-line";
import { resolveInboxLine } from "@/lib/inbox-request";
import { bumpInboxVersion } from "@/lib/inbox-sync";
import {
  activeContactsKey,
  contactKey,
  marketingContactKey,
  marketingContactsKey,
} from "@/lib/kv-keys";
import {
  getAllMarketingContacts,
  getMarketingContact,
  saveMarketingContact,
} from "@/lib/marketing-inbox";
import { isVoiceNoteFile } from "@/lib/meta-media";
import {
  markAllMessagesRead,
  markAllMessagesUnread,
  setMessageReadState,
} from "@/lib/read-state";
import { getWhatsAppAccessToken, WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const line = resolveInboxLine(request);
    const contacts = await getAllMarketingContacts(line);
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

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const { toPhone, replyText, contactName, type, mediaId, location, fileName, replyTo, isVoiceNote } =
      body;

    if (!toPhone) {
      return NextResponse.json({ error: "Missing recipient phone number" }, { status: 400 });
    }

    const phone = normalizePhone(toPhone);
    if (await isPhoneBlocked(phone, line)) {
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

    const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${getWhatsAppPhoneNumberIdForLine(line)}/messages`;
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
    let contact = await getMarketingContact(phone, line);
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

    await saveMarketingContact(contact, line);
    await bumpInboxVersion(line);
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

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const { phone, markRead, markUnread, messageId, messageRead, promoteToMain } = body;
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const contact = await getMarketingContact(normalized, line);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    let readStateChanged = false;
    if (markRead) {
      markAllMessagesRead(contact);
      readStateChanged = true;
    }
    if (markUnread) {
      markAllMessagesUnread(contact);
      readStateChanged = true;
    }
    if (messageId !== undefined && typeof messageRead === "boolean") {
      readStateChanged =
        setMessageReadState(contact, messageId, messageRead) || readStateChanged;
    }
    if (readStateChanged) {
      await saveMarketingContact(contact, line);
      await bumpInboxVersion(line);
    }

    if (promoteToMain) {
      let main: any = await kv.get(contactKey(line, normalized));
      if (!main) {
        main = { ...contact, hasUnread: false, unreadCount: 0 };
      } else {
        const ids = new Set(main.messages.map((m: any) => m.id));
        for (const msg of contact.messages) {
          if (!ids.has(msg.id)) main.messages.push(msg);
        }
        if (contact.name && main.name === "WhatsApp Contact") main.name = contact.name;
      }
      await kv.set(contactKey(line, normalized), main);
      await kv.sadd(activeContactsKey(line), normalized);
      await kv.srem(marketingContactsKey(line), normalized);
      await kv.del(marketingContactKey(line, normalized));
      await bumpInboxVersion(line);
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

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const { phone } = body;
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    await kv.srem(marketingContactsKey(line), normalized);
    await kv.del(marketingContactKey(line, normalized));
    await bumpInboxVersion(line);
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
