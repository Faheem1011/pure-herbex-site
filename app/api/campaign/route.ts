import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateName, recipientCount } = await request.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    sent: recipientCount || 10,
    template: templateName || "mushtaq_marketing",
    status: "dispatched",
  });
}
