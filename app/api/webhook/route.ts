import { NextRequest, NextResponse } from "next/server";
import { verifyMetaWebhookSignature } from "@/lib/webhook-signature";
import {
  processIncomingWebhookMessage,
  processIncomingWebhookStatus,
} from "@/lib/webhook-process";
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
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!verifyMetaWebhookSignature(rawBody, signature)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = JSON.parse(rawBody);

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          if (value.messages?.length) {
            for (const message of value.messages) {
              await processIncomingWebhookMessage(value, message);
            }
          }

          if (value.statuses?.length) {
            for (const status of value.statuses) {
              await processIncomingWebhookStatus(status);
            }
          }
        }
      }

      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
  } catch (error: unknown) {
    console.error("Webhook Error:", error);
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
