import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { normalizePhone } from "@/lib/blocked";
import { kv } from "@/lib/kv";
import { contactKey } from "@/lib/kv-keys";
import { resolveInboxLine } from "@/lib/inbox-request";
import {
  getMetaLeadQualityStats,
  syncMetaLeadQualityForContact,
} from "@/lib/meta-lead-quality";
import { isMetaCapiConfigured } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getMetaLeadQualityStats();
    return NextResponse.json({
      ...stats,
      configured: isMetaCapiConfigured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load Meta stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Re-send lead quality signals for one contact (manual sync). */
export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const line = resolveInboxLine(request, body);
    const phone = normalizePhone(body.phone || "");
    if (!phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 });
    }

    const contact: {
      name?: string;
      tag?: string | null;
      blocked?: boolean;
      adReferral?: { ctwaClid?: string; sourceId?: string; sourceType?: string };
    } | null = await kv.get(contactKey(line, phone));

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const result = await syncMetaLeadQualityForContact({
      phone,
      name: contact.name,
      tag: contact.tag,
      blocked: contact.blocked,
      adReferral: contact.adReferral,
    });

    const stats = await getMetaLeadQualityStats();
    return NextResponse.json({ status: "success", ...result, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Meta sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
