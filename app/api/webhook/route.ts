import { NextRequest, NextResponse } from "next/server";

// This is the GET endpoint used by Meta to verify your webhook subscription.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Read verification token from environment variables
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "pure_herbex_secret_token";

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

// This is the POST endpoint where Meta will deliver message replies and delivery status updates.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a WhatsApp status update or message event
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Log the event details (you can save this to a database, trigger automated replies, etc.)
      console.log("WhatsApp Webhook Event Received:", JSON.stringify(body, null, 2));

      // 1. Check if it's a message reply from a customer
      if (value?.messages) {
        const message = value.messages[0];
        const from = message.from; // Customer's phone number
        const text = message.text?.body; // Message content

        console.log(`New reply from ${from}: "${text}"`);
        
        // TODO: Trigger automated reply logic or save to CRM database here
      }

      // 2. Check if it's a delivery status update (sent/delivered/read)
      if (value?.statuses) {
        const status = value.statuses[0];
        const recipient_id = status.recipient_id;
        const msg_status = status.status; // "sent", "delivered", or "read"
        
        console.log(`Message to ${recipient_id} status updated to: ${msg_status}`);
      }

      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
