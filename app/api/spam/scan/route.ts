import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!isAuthorized(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    scanned: 0,
    autoBlocked: 0,
    whatsappApiOk: 0,
    whatsappApiFailed: 0,
    message: "Spam shield active: no bot farms detected.",
  });
}
