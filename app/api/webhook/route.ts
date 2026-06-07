import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isPhoneBlocked } from "@/lib/blocked";
import { getWhatsAppVerifyToken } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === getWhatsAppVerifyToken()) {
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

        if (await isPhoneBlocked(from)) {
          return NextResponse.json({ status: "ignored_blocked" }, { status: 200 });
        }

        const msgType = message.type || "text";
        const timestamp = message.timestamp || Math.floor(Date.now() / 1000);
        const msgId = message.id;

        let text = message.text?.body || "";
        let mediaId = "";
        let fileName = "";
        let location = null;

        if (msgType === "image") {
          mediaId = message.image?.id || "";
          text = message.image?.caption || "📷 Photo";
        } else if (msgType === "audio" || msgType === "voice") {
          // WhatsApp voice notes can come as 'audio' or 'voice' type
          mediaId = message.voice?.id || message.audio?.id || "";
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

        // Fetch existing contact or create new
        let contact: any = await kv.get(`whatsapp:contact:${from}`);
        if (!contact) {
          const profileName = value.contacts?.[0]?.profile?.name || "WhatsApp Contact";
          contact = {
            name: profileName,
            phone: from,
            messages: []
          };
        }

        // Add message if it doesn't already exist
        const isDuplicate = contact.messages.some((m: any) => m.id === msgId);
        if (!isDuplicate) {
          // Handle quoted messages in webhook
          let replyToId = undefined;
          if (message.context?.id) {
            replyToId = message.context.id;
          }

          contact.messages.push({
            id: msgId,
            sender: "them",
            text: text,
            timestamp: parseInt(timestamp),
            status: "received",
            type: msgType,
            mediaId: mediaId || undefined,
            replyTo: replyToId,
            fileName: fileName || undefined,
            location: location || undefined
          });

          // Set unread states only for new messages
          contact.unreadCount = (contact.unreadCount || 0) + 1;
          contact.hasUnread = true;

          // Save back to KV
          await kv.set(`whatsapp:contact:${from}`, contact);
          // Track list of active contacts
          await kv.sadd("whatsapp:active_contacts", from);
        }
      }

      // Handle status updates (sent, delivered, read, failed)
      if (value?.statuses) {
        const status = value.statuses[0];
        const recipient_id = status.recipient_id;
        const msg_id = status.id;
        const msg_status = status.status;
        const errorCode = status.errors?.[0]?.code;
        const errorTitle = status.errors?.[0]?.title || status.errors?.[0]?.message;

        let contact: any = await kv.get(`whatsapp:contact:${recipient_id}`);
        if (contact && contact.messages) {
          let updated = false;
          for (let msg of contact.messages) {
            if (msg.id === msg_id) {
              msg.status = msg_status;
              if (msg_status === "failed" && errorTitle) {
                msg.text = `🚫 Delivery failed: ${errorTitle}`;
              }
              updated = true;
              break;
            }
          }
          if (updated) {
            await kv.set(`whatsapp:contact:${recipient_id}`, contact);
          }
        }

        // Sync marketing campaign status when Meta rejects delivery (e.g. error 130472)
        if (msg_status === "failed") {
          const campaignStatus: Record<string, any> =
            (await kv.get("whatsapp:campaign_status")) || {};
          const entry = campaignStatus[recipient_id];
          if (entry?.messageId === msg_id || entry?.status === "sent") {
            const experimentNote =
              errorCode === 130472
                ? "Meta experiment: user cannot receive marketing until they message you first (error 130472)"
                : errorTitle || "Delivery failed";
            campaignStatus[recipient_id] = {
              ...entry,
              status: "failed",
              error: experimentNote,
              failedAt: Date.now(),
            };
            await kv.set("whatsapp:campaign_status", campaignStatus);
          }
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
