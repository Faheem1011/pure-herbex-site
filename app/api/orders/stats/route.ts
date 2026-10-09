import { NextRequest, NextResponse } from "next/server";
import { getDb, isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const orders = db.orders || [];

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return NextResponse.json(stats);
}
