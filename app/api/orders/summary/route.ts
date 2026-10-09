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
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return NextResponse.json({
    totalOrders: orders.length,
    totalRevenue,
    currency: "PKR",
  });
}
