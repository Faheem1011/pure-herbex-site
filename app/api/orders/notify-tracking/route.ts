import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { getOrderById } from "@/lib/crm-orders";
import { normalizePhone } from "@/lib/blocked";
import { kv } from "@/lib/kv";
import { bumpInboxVersion } from "@/lib/inbox-sync";
import { getWhatsAppAccessToken, getWhatsAppPhoneNumberId, WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.trackingNumber?.trim()) {
      return NextResponse.json({ error: "Add a tracking number first" }, { status: 400 });
    }

    const phone = normalizePhone(order.phone);
    const courier = order.courier || "Courier";
    const text =
      `Assalam o Alaikum ${order.customerName}!\n\n` +
      `Your Pure Herbex order has been shipped.\n\n` +
      `Courier: ${courier}\n` +
      `Tracking: ${order.trackingNumber}\n\n` +
      `Thank you for your order!`;

    const metaRes = await fetch(
      `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${getWhatsAppPhoneNumberId()}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getWhatsAppAccessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      const err =
        metaData.error?.message ||
        "WhatsApp could not send — customer may be outside the 24-hour reply window. Send manually from inbox.";
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const msgId = metaData.messages?.[0]?.id as string | undefined;
    const now = Math.floor(Date.now() / 1000);

    let contact: any = await kv.get(`whatsapp:contact:${phone}`);
    if (!contact) {
      contact = { name: order.customerName, phone, messages: [] };
    }
    contact.messages = [
      ...(contact.messages || []),
      {
        id: msgId || `local_${Date.now()}`,
        sender: "me",
        text: `📦 Tracking sent: ${order.trackingNumber}`,
        timestamp: now,
        status: "sent",
        type: "text",
      },
    ];
    await kv.set(`whatsapp:contact:${phone}`, contact);
    await kv.sadd("whatsapp:active_contacts", phone);
    await bumpInboxVersion();

    return NextResponse.json({ status: "success", messageId: msgId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Notify failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
