import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { scheduleOrdersSheetSync } from "@/lib/crm-auto-sync";
import {
  archiveOrder,
  createOrder,
  getOrderById,
  listOrders,
  updateOrder,
} from "@/lib/crm-orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/crm-types";
import { notifyMetaOrderStatus } from "@/lib/meta-lead-quality";
import { kv } from "@/lib/kv";
import { contactKey } from "@/lib/kv-keys";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone") || undefined;

    if (id) {
      const order = await getOrderById(id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    const status = (searchParams.get("status") || "active") as
      | OrderStatus
      | "active"
      | "all"
      | "archived";
    const search = searchParams.get("search") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "1";

    const orders = await listOrders({
      status,
      search,
      phone,
      includeArchived: includeArchived || status === "all",
    });
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const order = await createOrder(body);
    scheduleOrdersSheetSync();
    return NextResponse.json({ status: "success", order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    if (message.startsWith("ACTIVE_ORDER_EXISTS:")) {
      const existingId = message.split(":")[1];
      return NextResponse.json(
        { error: "Active order already exists for this phone", existingId },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statusNote, ...patch } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    if (patch.status && !ORDER_STATUSES.includes(patch.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const previous = await getOrderById(id);
    const order = await updateOrder(id, { ...patch, statusNote });
    scheduleOrdersSheetSync();

    if (patch.status && previous && patch.status !== previous.status) {
      const contact: { adReferral?: { ctwaClid?: string } } | null = await kv.get(
        contactKey("main", order.phone)
      );
      void notifyMetaOrderStatus({
        phone: order.phone,
        customerName: order.customerName,
        status: order.status,
        previousStatus: previous.status,
        amount: order.amount,
        orderId: order.id,
        adReferral: contact?.adReferral,
      });
    }

    return NextResponse.json({ status: "success", order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    await archiveOrder(id);
    scheduleOrdersSheetSync();
    return NextResponse.json({ status: "success" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
