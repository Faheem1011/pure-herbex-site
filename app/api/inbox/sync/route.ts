import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { bumpInboxVersion, fetchInboxSnapshot, getInboxVersion } from "@/lib/inbox-sync";
import { EXPECTED_KV_HOST, getKvHost } from "@/lib/kv-config";
import { inboxLineLabel } from "@/lib/inbox-line";
import { resolveInboxLine } from "@/lib/inbox-request";
import { migrateMarketingOnlyFromMain } from "@/lib/marketing-inbox";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const line = resolveInboxLine(request);
    const since = Number(new URL(request.url).searchParams.get("since") || "0");
    const version = await getInboxVersion(line);
    const kvHost = getKvHost();
    const kvMeta = {
      kvHost,
      kvOk: kvHost === EXPECTED_KV_HOST,
      line,
      lineLabel: inboxLineLabel(line),
    };

    if (since > 0 && since >= version) {
      return NextResponse.json({ version, unchanged: true, ...kvMeta });
    }

    await migrateMarketingOnlyFromMain(line);
    const snapshot = await fetchInboxSnapshot(line);
    if (
      snapshot.version === 0 &&
      snapshot.contacts.length + snapshot.campaignContacts.length > 0
    ) {
      await bumpInboxVersion(line);
      snapshot.version = await getInboxVersion(line);
    }
    return NextResponse.json({ ...snapshot, ...kvMeta });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
