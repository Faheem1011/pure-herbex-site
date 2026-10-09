import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_VERIFY_TOKENS = [
  process.env.WHATSAPP_VERIFY_TOKEN,
  "mushtaq_secret_token",
  "pure_herbex_secret_token",
].filter(Boolean);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && VALID_VERIFY_TOKENS.includes(token)) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Handle incoming message replies
      if (value?.messages) {
        const message = value.messages[0];
        const from = message.from;
        const msgType = message.type || "text";
        const timestamp = parseInt(message.timestamp || `${Math.floor(Date.now() / 1000)}`, 10);
        const msgId = message.id;

        let text = message.text?.body || "";
        let mediaId = "";
        let fileName = "";
        let location = null;

        if (msgType === "image") {
          mediaId = message.image?.id || "";
          text = message.image?.caption || "📷 Photo";
        } else if (msgType === "audio" || msgType === "voice") {
          mediaId = message.audio?.id || message.voice?.id || "";
          text = "🎵 Audio/Voice Note";
        } else if (msgType === "video") {
          mediaId = message.video?.id || "";
          text = message.video?.caption || "🎥 Video";
        } else if (msgType === "document") {
          mediaId = message.document?.id || "";
          fileName = message.document?.filename || "";
          text = fileName ? `📄 File: ${fileName}` : "📄 File";
        } else if (msgType === "location") {
          location = {
            latitude: message.location?.latitude,
            longitude: message.location?.longitude,
            name: message.location?.name || "",
            address: message.location?.address || "",
          };
          text = location.name ? `📍 Location: ${location.name}` : "📍 Location";
        } else if (!text) {
          text = `(${msgType} message)`;
        }

        // Sync with unified lib/db
        const db = await getDb();
        let dbContact = db.contacts.find((c) => c.phone === from);
        if (!dbContact) {
          const profileName = value.contacts?.[0]?.profile?.name || from;
          dbContact = {
            name: profileName,
            phone: from,
            messages: [],
            tag: null,
            archived: false,
            unreadCount: 0,
            hasUnread: false,
          };
          db.contacts.unshift(dbContact);
        }

        const isDuplicate = dbContact.messages.some((m) => m.id === msgId);
        if (!isDuplicate) {
          dbContact.messages.push({
            id: msgId,
            sender: "them",
            text: text,
            timestamp: timestamp,
            status: "received",
            type: msgType,
            mediaId: mediaId || undefined,
            fileName: fileName || undefined,
            location: location || undefined,
          });

          dbContact.unreadCount = (dbContact.unreadCount || 0) + 1;
          dbContact.hasUnread = true;
          await saveDb(db);
        }

        // Optional KV sync
        try {
          if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            await kv.set(`whatsapp:contact:${from}`, dbContact);
            await kv.sadd("whatsapp:active_contacts", from);
          }
        } catch (e) {}
      }

      // Handle status updates (sent, delivered, read)
      if (value?.statuses) {
        const status = value.statuses[0];
        const recipient_id = status.recipient_id;
        const msg_id = status.id;
        const msg_status = status.status;

        const db = await getDb();
        const dbContact = db.contacts.find((c) => c.phone === recipient_id);
        if (dbContact && dbContact.messages) {
          for (let msg of dbContact.messages) {
            if (msg.id === msg_id) {
              msg.status = msg_status;
              break;
            }
          }
          await saveDb(db);
        }
      }

      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
