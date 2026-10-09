import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();
  const db = await getDb();
  const order = db.orders?.find((o) => o.id === orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const contact = db.contacts.find((c) => c.phone === order.phone);
  if (contact) {
    contact.messages.push({
      id: `wamid_track_${Date.now()}`,
      sender: "me",
      text: `📦 Parcel Update for Order ${order.id}: Dispatched via ${order.courier || "Courier"}. Tracking #: ${order.trackingNumber || "N/A"}. Expected delivery within 24-48 hours.`,
      timestamp: Math.floor(Date.now() / 1000),
      status: "delivered",
      type: "text",
    });
    await saveDb(db);
  }

  return NextResponse.json({ success: true, message: "Tracking notification sent" });
}
