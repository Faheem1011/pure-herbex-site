import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, isAuthorized, Order } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const phone = searchParams.get("phone");
  const db = await getDb();

  let orders = db.orders || [];

  if (phone) {
    orders = orders.filter((o) => o.phone === phone);
  } else if (status && status !== "all") {
    orders = orders.filter((o) => o.status === status);
  }

  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderData = await request.json();
  const newOrder: Order = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    ...orderData,
    createdAt: new Date().toISOString(),
  };

  const db = await getDb();
  if (!db.orders) db.orders = [];
  db.orders.unshift(newOrder);

  await saveDb(db);
  return NextResponse.json({ success: true, order: newOrder });
}
