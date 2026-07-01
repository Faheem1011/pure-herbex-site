import { NextRequest, NextResponse } from "next/server";
import type { Contact } from "@/app/inbox/types";
import { isInboxAuthed } from "@/lib/auth";
import { blockContactCompletely, getSpamStats } from "@/lib/contact-block";
import { fetchMainContacts } from "@/lib/inbox-sync";
import { resolveInboxLine } from "@/lib/inbox-request";
import { assessSpamProfile } from "@/lib/spam-detect";

export const dynamic = "force-dynamic";

/** GET spam auto-block statistics */
export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const stats = await getSpamStats();
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load spam stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST — scan existing inbox contacts and block farm-style profile names.
 * Skips contacts tagged Confirm (real leads).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const line = resolveInboxLine(request);
    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const contacts = (await fetchMainContacts(line)) as Contact[];
    const matched: Array<{ phone: string; name: string; score: number }> = [];
    let blocked = 0;
    let whatsappOk = 0;
    let whatsappFailed = 0;

    for (const c of contacts) {
      if (c.blocked || c.tag === "Confirm") continue;
      const assessment = assessSpamProfile(c.name);
      if (assessment.verdict !== "spam") continue;

      matched.push({ phone: c.phone, name: c.name, score: assessment.score });
      if (dryRun) continue;

      const result = await blockContactCompletely({
        phone: c.phone,
        line,
        name: c.name,
        reason: "auto_spam",
        tagSpam: true,
      });
      blocked += 1;
      if (result.whatsappBlocked) whatsappOk += 1;
      else whatsappFailed += 1;
    }

    const stats = await getSpamStats();

    return NextResponse.json({
      dryRun,
      scanned: contacts.length,
      matched: matched.length,
      blocked,
      whatsappOk,
      whatsappFailed,
      samples: matched.slice(0, 25),
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Spam scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
