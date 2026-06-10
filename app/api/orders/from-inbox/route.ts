import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { createOrder, findActiveOrderByPhone } from "@/lib/crm-orders";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, customerName } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    const existing = await findActiveOrderByPhone(phone);
    if (existing) {
      return NextResponse.json({
        status: "exists",
        order: existing,
        message: "Active order already exists",
      });
    }

    const order = await createOrder({
      phone,
      customerName: customerName || "WhatsApp Customer",
      source: "inbox_confirm",
      status: "pending_details",
    });

    return NextResponse.json({ status: "success", order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order from inbox";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
