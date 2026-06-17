import { NextRequest, NextResponse } from "next/server";
import { runWindowFollowups } from "@/lib/window-followup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.WINDOW_FOLLOWUP_ENABLED === "false") {
    return NextResponse.json({ status: "disabled" });
  }

  try {
    const result = await runWindowFollowups("main");
    return NextResponse.json({ status: "ok", ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
