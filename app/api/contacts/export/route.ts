import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import {
  contactsToCsv,
  contactsToJson,
  toExportRows,
  type ExportableContact,
} from "@/lib/export-contacts";
import { fetchMainContacts } from "@/lib/inbox-sync";

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = new URL(request.url).searchParams.get("format") || "csv";
    const contacts = (await fetchMainContacts()) as ExportableContact[];
    const rows = toExportRows(contacts);
    const stamp = new Date().toISOString().slice(0, 10);

    const countHeader = { "X-Contact-Count": String(rows.length) };

    if (format === "json") {
      return new NextResponse(contactsToJson(rows), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="pure-herbex-inbox-contacts-${stamp}.json"`,
          ...countHeader,
        },
      });
    }

    return new NextResponse(contactsToCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pure-herbex-inbox-contacts-${stamp}.csv"`,
        ...countHeader,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
