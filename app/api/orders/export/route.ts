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

  let csv = "Order ID,Customer Name,Phone,City,Address,Product,Quantity,Total,Status,Courier,Tracking\n";
  orders.forEach((o) => {
    csv += `"${o.id}","${o.customerName || ""}","${o.phone || ""}","${o.city || ""}","${o.address || ""}","${o.product || ""}",${o.quantity || 1},${o.total || 0},"${o.status || ""}","${o.courier || ""}","${o.trackingNumber || ""}"\n`;
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders_export.csv"',
    },
  });
}
