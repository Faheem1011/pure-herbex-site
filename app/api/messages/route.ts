import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isInboxAuthed } from "@/lib/auth";
import { isPhoneBlocked, normalizePhone, setPhoneBlocked } from "@/lib/blocked";
import { getWhatsAppAccessToken, getWhatsAppPhoneNumberId } from "@/lib/whatsapp";

// 1. GET: Fetch all active chats and message history
export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the list of active contact numbers
    const activeNumbers: string[] = await kv.smembers("whatsapp:active_contacts");
    
    if (activeNumbers.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    // Fetch all contact data in a single mget call for better performance
    const contactKeys = activeNumbers.map(phone => `whatsapp:contact:${phone}`);
    const contactsData = await kv.mget(contactKeys);
    
    const contacts = contactsData.filter(c => c !== null);

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

    const { toPhone, replyText, contactName, type, mediaId, location, fileName, replyTo } = await request.json();

    if (!toPhone) {
      return NextResponse.json({ error: "Missing recipient phone number" }, { status: 400 });
    }

    if (await isPhoneBlocked(toPhone)) {
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

    const url = `https://graph.facebook.com/v20.0/${getWhatsAppPhoneNumberId()}/messages`;
    
    // Build Payload based on Message Type
    let messagePayload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
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
      messagePayload.audio = { id: mediaId };
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
      let contact: any = await kv.get(`whatsapp:contact:${toPhone}`);
      if (!contact) {
        contact = {
          name: contactName || "WhatsApp Contact",
          phone: toPhone,
          messages: []
        };
      } else if (contactName && contact.name === "WhatsApp Contact") {
        contact.name = contactName;
      }

      // Format text content for logs
      let displayLogText = replyText || "";
      if (msgType === "image") displayLogText = "📷 Photo";
      else if (msgType === "audio") displayLogText = "🎵 Audio/Voice Note";
      else if (msgType === "video") displayLogText = "🎥 Video";
      else if (msgType === "document") displayLogText = fileName ? `📄 File: ${fileName}` : "📄 File";
      else if (msgType === "location") displayLogText = location?.name ? `📍 Location: ${location.name}` : "📍 Location";

      contact.messages.push({
        id: msgId,
        sender: "me",
        text: displayLogText,
        timestamp: Math.floor(Date.now() / 1000),
        status: "sent",
        type: msgType,
        mediaId: mediaId || undefined,
        replyTo: replyTo || undefined,
        location: location || undefined,
        fileName: fileName || undefined
      });

      await kv.set(`whatsapp:contact:${toPhone}`, contact);
      await kv.sadd("whatsapp:active_contacts", toPhone);

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

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    await kv.srem("whatsapp:active_contacts", phone);
    await kv.del(`whatsapp:contact:${phone}`);

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

    const { phone, archived, markRead, deleteMessageId, pinned, blocked } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    let contact: any = await kv.get(`whatsapp:contact:${normalized}`);
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
      if (markRead) {
        contact.unreadCount = 0;
        contact.hasUnread = false;
      }
      if (pinned !== undefined) {
        contact.pinned = !!pinned;
      }
      if (blocked !== undefined) {
        contact.blocked = !!blocked;
        await setPhoneBlocked(normalized, !!blocked);
      }
      if (deleteMessageId) {
        if (contact.messages) {
          contact.messages = contact.messages.map((m: any) => 
            m.id === deleteMessageId ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
          );
        }
      }
      await kv.set(`whatsapp:contact:${normalized}`, contact);
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

