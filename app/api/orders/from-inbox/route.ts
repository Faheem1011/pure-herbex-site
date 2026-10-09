import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized, Order } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerName, phone, address, city, product, quantity, total, notes } = await request.json();

  const newOrder: Order = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    customerName: customerName || "Customer",
    phone: phone,
    address: address || "",
    city: city || "Okara",
    product: product || "Mushtaq Ultra Force",
    quantity: quantity || 1,
    total: total || 3000,
    status: "confirmed",
    courier: "Leopards Courier",
    trackingNumber: `LP${Math.floor(10000000 + Math.random() * 90000000)}`,
    notes: notes || "",
    source: "Direct WhatsApp Chat",
    createdAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (!db.orders) db.orders = [];
  db.orders.unshift(newOrder);

  // Add automated order confirmation message into chat
  const contact = db.contacts.find((c) => c.phone === phone);
  if (contact) {
    contact.tag = "Confirm";
    contact.messages.push({
      id: `wamid_order_${Date.now()}`,
      sender: "me",
      text: `🎉 Order Confirmed! Reference: ${newOrder.id}. Tracking No: ${newOrder.trackingNumber} (${newOrder.courier}). Amount: Rs. ${newOrder.total} (Cash on Delivery).`,
      timestamp: Math.floor(Date.now() / 1000),
      status: "delivered",
      type: "text",
    });
  }

  await saveDb(db);
  return NextResponse.json({ success: true, order: newOrder });
}
