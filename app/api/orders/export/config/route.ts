import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { getGoogleSheetUrl, isGoogleSheetsConfigured } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isInboxAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let serviceAccountEmail: string | null = null;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as {
        client_email?: string;
      };
      serviceAccountEmail = parsed.client_email || null;
    } catch {
      serviceAccountEmail = null;
    }
  }

  return NextResponse.json({
    configured: isGoogleSheetsConfigured(),
    sheetUrl: getGoogleSheetUrl(),
    tab: process.env.GOOGLE_SHEETS_TAB || "Orders",
    serviceAccountEmail,
  });
}
