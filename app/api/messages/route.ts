import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized, Message, Contact } from "@/lib/db";

export const dynamic = "force-dynamic";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1098694096667377";

// 1. GET: Fetch all active chats and message history
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const db = await getDb();

  if (phone) {
    const contact = db.contacts.find((c) => c.phone === phone);
    return NextResponse.json({ contact: contact || null, messages: contact?.messages || [] });
  }

  return NextResponse.json({ contacts: db.contacts });
}

// 2. POST: Send a reply message to a contact
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toPhone, replyText, contactName, type, mediaId, location, fileName } = await request.json();

  if (!toPhone) {
    return NextResponse.json({ error: "Missing recipient phone number" }, { status: 400 });
  }

  const db = await getDb();
  let contact = db.contacts.find((c) => c.phone === toPhone);
  if (!contact) {
    contact = {
      name: contactName || toPhone,
      phone: toPhone,
      messages: [],
      tag: null,
      archived: false,
      unreadCount: 0,
      hasUnread: false,
    };
    db.contacts.unshift(contact);
  }

  const newMsg: Message = {
    id: `wamid_${Date.now()}`,
    sender: "me",
    text: replyText || "",
    timestamp: Math.floor(Date.now() / 1000),
    status: "sent",
    type: type || "text",
    mediaId,
    fileName,
    location,
  };

  contact.messages.push(newMsg);
  await saveDb(db);

  // Send to Meta WhatsApp Cloud API if credentials present
  if (accessToken && phoneNumberId) {
    try {
      const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
      };

      if (!type || type === "text") {
        payload.type = "text";
        payload.text = { body: replyText };
      } else if (type === "location" && location) {
        payload.type = "location";
        payload.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name || "Shared Location",
          address: location.address || "",
        };
      } else if (mediaId) {
        payload.type = type === "voice" ? "audio" : type;
        payload[payload.type] = { id: mediaId };
        if (fileName && type === "document") {
          payload.document.filename = fileName;
        }
      }

      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).catch((e) => console.log("Meta API dispatch note:", e.message));
    } catch (e) {}
  }

  return NextResponse.json({ success: true, message: newMsg });
}

// 3. PATCH: Mark read, tag, or archive
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone, archived, markRead, tag } = await request.json();
  const db = await getDb();
  const contact = db.contacts.find((c) => c.phone === phone);

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (archived !== undefined) contact.archived = archived;
  if (markRead) {
    contact.unreadCount = 0;
    contact.hasUnread = false;
  }
  if (tag !== undefined) contact.tag = tag;

  await saveDb(db);
  return NextResponse.json({ success: true, contact });
}

// 4. DELETE: Delete a contact
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  }

  const db = await getDb();
  db.contacts = db.contacts.filter((c) => c.phone !== phone);
  await saveDb(db);

  return NextResponse.json({ success: true });
}
