import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "pure_herbex_secret_token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
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
        const text = message.text?.body || "(Media/Non-text message)";
        const timestamp = message.timestamp || Math.floor(Date.now() / 1000);
        const msgId = message.id;

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

        // Add message
        contact.messages.push({
          id: msgId,
          sender: "them",
          text: text,
          timestamp: parseInt(timestamp),
          status: "received"
        });

        // Save back to KV
        await kv.set(`whatsapp:contact:${from}`, contact);
        // Track list of active contacts
        await kv.sadd("whatsapp:active_contacts", from);
      }

      // Handle status updates (sent, delivered, read)
      if (value?.statuses) {
        const status = value.statuses[0];
        const recipient_id = status.recipient_id;
        const msg_id = status.id;
        const msg_status = status.status; // "sent", "delivered", "read"

        let contact: any = await kv.get(`whatsapp:contact:${recipient_id}`);
        if (contact && contact.messages) {
          let updated = false;
          for (let msg of contact.messages) {
            if (msg.id === msg_id) {
              msg.status = msg_status;
              updated = true;
              break;
            }
          }
          if (updated) {
            await kv.set(`whatsapp:contact:${recipient_id}`, contact);
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
