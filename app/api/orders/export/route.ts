import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { isInboxAuthed } from "@/lib/auth";
import { listOrders } from "@/lib/crm-orders";
import { ordersToCsv } from "@/lib/export-orders";

const ARCHIVED_SET = "crm:orders:archived";
import {
  getGoogleSheetUrl,
  isGoogleSheetsConfigured,
  syncOrdersToGoogleSheet,
} from "@/lib/google-sheets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "all") as "all" | "active";
    const orders = await listOrders({
      status: "all",
      includeArchived: true,
      limit: 3000,
    });
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(ordersToCsv(orders), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pure-herbex-orders-${stamp}.csv"`,
        "X-Order-Count": String(orders.length),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json(
        {
          error: "Google Sheets not configured",
          hint: "Add GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON on Vercel.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const archivedIds = new Set<string>(
      ((await kv.smembers(ARCHIVED_SET)) as string[]) || []
    );
    const orders = await listOrders({
      status: "all",
      includeArchived: true,
      limit: 3000,
    });
    const result = await syncOrdersToGoogleSheet(orders, archivedIds);

    return NextResponse.json({
      status: "success",
      rowCount: result.rowCount,
      sheetUrl: result.sheetUrl,
      tab: result.tab,
      configured: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Google Sheets sync failed";
    return NextResponse.json(
      {
        error: message,
        sheetUrl: getGoogleSheetUrl(),
        configured: isGoogleSheetsConfigured(),
      },
      { status: 500 }
    );
  }
}
