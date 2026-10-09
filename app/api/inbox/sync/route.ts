import { NextRequest, NextResponse } from "next/server";
import { getDb, isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = parseInt(searchParams.get("since") || "0", 10);
  const db = await getDb();

  if (since > 0 && since >= db.version) {
    return NextResponse.json({
      version: db.version,
      unchanged: true,
    });
  }

  return NextResponse.json({
    version: db.version,
    unchanged: false,
    contacts: db.contacts || [],
    campaignContacts: db.campaignContacts || [],
  });
}
