import { VALID_TAG_IDS } from "@/app/inbox/constants";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone, setPhoneBlocked } from "@/lib/blocked";
import { getWhatsAppPhoneNumberIdForLine } from "@/lib/inbox-line";
import { resolveInboxLine } from "@/lib/inbox-request";
import { registerKnownMediaId } from "@/lib/media-index";
import { bumpInboxVersion, fetchMainContacts } from "@/lib/inbox-sync";
import { activeContactsKey, contactKey } from "@/lib/kv-keys";
import {
  markAllMessagesRead,
  markAllMessagesUnread,
  setMessageReadState,
} from "@/lib/read-state";
import { isVoiceNoteFile } from "@/lib/meta-media";
import { getWhatsAppAccessToken, WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

// 1. GET: Fetch all active chats and message history
export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const line = resolveInboxLine(request);
    const phoneParam = new URL(request.url).searchParams.get("phone");

    if (phoneParam) {
      const normalized = normalizePhone(phoneParam);
      if (!normalized) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      const contact = await kv.get(contactKey(line, normalized));
      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      return NextResponse.json({ contact });
    }

    const contacts = await fetchMainContacts(line);
    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Send a reply message to a contact
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const {
      toPhone,
      replyText,
      contactName,
      type,
      mediaId,
      location,
      fileName,
      replyTo,
      isVoiceNote,
      agentNote,
    } = body;

    if (!toPhone) {
      return NextResponse.json({ error: "Missing recipient phone number" }, { status: 400 });
    }

    const phone = normalizePhone(toPhone);
    if (!phone) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (await isPhoneBlocked(phone, line)) {
      return NextResponse.json({ error: "This contact is blocked. Unblock them to send messages." }, { status: 403 });
    }

    const msgType = type || "text";
    if (msgType === "text" && !replyText) {
      return NextResponse.json({ error: "Missing text content" }, { status: 400 });
    }
    if (["image", "audio", "video", "document"].includes(msgType) && !mediaId) {
      return NextResponse.json({ error: `Missing media ID for type ${msgType}` }, { status: 400 });
    }
    if (msgType === "location" && (!location || !location.latitude || !location.longitude)) {
      return NextResponse.json({ error: "Missing latitude or longitude for location" }, { status: 400 });
    }

    const sendAsVoice =
      msgType === "audio" &&
      (!!isVoiceNote ||
        (!!fileName && isVoiceNoteFile({ name: fileName, type: "audio/ogg" })));

    const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${getWhatsAppPhoneNumberIdForLine(line)}/messages`;
    
    // Build Payload based on Message Type
    let messagePayload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: msgType,
    };

    // Handle quoted messages
    if (replyTo) {
      messagePayload.context = { message_id: replyTo };
    }

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

    // Call Meta API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getWhatsAppAccessToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messagePayload)
    });

    const respData = await response.json();

    if (response.ok) {
      const msgId = respData.messages?.[0]?.id || "N/A";

      // Save the sent message to KV store
      let contact: any = await kv.get(contactKey(line, phone));
      if (!contact) {
        contact = {
          name: contactName || "WhatsApp Contact",
          phone: phone,
          messages: []
        };
      } else if (contactName && contact.name === "WhatsApp Contact") {
        contact.name = contactName;
      }

      // Format text content for logs
      let displayLogText = replyText || "";
      if (msgType === "image") displayLogText = "📷 Photo";
      else if (msgType === "audio") displayLogText = sendAsVoice ? "🎤 Voice Note" : "🎵 Audio";
      else if (msgType === "video") displayLogText = "🎥 Video";
      else if (msgType === "document") displayLogText = fileName ? `📄 File: ${fileName}` : "📄 File";
      else if (msgType === "location") displayLogText = location?.name ? `📍 Location: ${location.name}` : "📍 Location";

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
        agentNote:
          typeof agentNote === "string" && agentNote.trim()
            ? agentNote.trim().slice(0, 200)
            : undefined,
      });

      await kv.set(contactKey(line, phone), contact);
      await kv.sadd(activeContactsKey(line), phone);
      await registerKnownMediaId(mediaId, line);
      await bumpInboxVersion(line);

      return NextResponse.json({ status: "success", msgId });
    } else {
      const errorMsg = respData.error?.message || "Failed to send message via Meta API";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Delete a conversation completely
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
    await kv.srem(activeContactsKey(line), normalized);
    await kv.del(contactKey(line, normalized));
    await bumpInboxVersion(line);

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. PATCH: Archive/Unarchive a conversation
export async function PATCH(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const {
      phone,
      archived,
      markRead,
      markUnread,
      messageId,
      messageRead,
      deleteMessageId,
      pinned,
      blocked,
      agentNote,
    } = body;
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    let contact: any = await kv.get(contactKey(line, normalized));
    if (!contact && blocked !== undefined) {
      contact = {
        name: "WhatsApp Contact",
        phone: normalized,
        messages: [],
      };
    }
    if (contact) {
      if (archived !== undefined) {
        contact.archived = !!archived;
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
      if (pinned !== undefined) {
        contact.pinned = !!pinned;
      }
      if (blocked !== undefined) {
        contact.blocked = !!blocked;
        await setPhoneBlocked(normalized, !!blocked, line);
      }
      if (body.tag !== undefined) {
        const rawTag = body.tag;
        contact.tag = rawTag && VALID_TAG_IDS.has(rawTag) ? rawTag : null;
      }
      if (deleteMessageId) {
        if (contact.messages) {
          contact.messages = contact.messages.map((m: any) => 
            m.id === deleteMessageId ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
          );
        }
      }
      let noteChanged = false;
      if (messageId && agentNote !== undefined && contact.messages) {
        contact.messages = contact.messages.map((m: any) => {
          if (m.id !== messageId || m.sender !== "me") return m;
          noteChanged = true;
          const trimmed =
            typeof agentNote === "string" ? agentNote.trim().slice(0, 200) : "";
          if (!trimmed) {
            const { agentNote: _removed, ...rest } = m;
            return rest;
          }
          return { ...m, agentNote: trimmed };
        });
      }
      await kv.set(contactKey(line, normalized), contact);
      if (
        archived !== undefined ||
        pinned !== undefined ||
        blocked !== undefined ||
        body.tag !== undefined ||
        deleteMessageId ||
        readStateChanged ||
        noteChanged
      ) {
        await bumpInboxVersion(line);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

