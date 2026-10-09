import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    qualityScore: 98,
    verifiedLeads: 240,
    blockedSpam: 12,
  });
}
