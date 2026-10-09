import { NextRequest, NextResponse } from "next/server";
import { getDb, isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  return NextResponse.json({
    templates: [
      { name: "mushtaq_order_confirm", category: "UTILITY", status: "APPROVED" },
      { name: "mushtaq_tracking_update", category: "UTILITY", status: "APPROVED" },
      { name: "mushtaq_discount_offer", category: "MARKETING", status: "APPROVED" },
    ],
    campaignContacts: db.campaignContacts || [],
  });
}
