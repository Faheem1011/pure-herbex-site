import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { normalizePhone } from "@/lib/blocked";
import { kv } from "@/lib/kv";
import { contactKey } from "@/lib/kv-keys";
import { resolveInboxLine } from "@/lib/inbox-request";
import { getMetaDatasetId, hasMetaCapiToken, META_DATASET_ID } from "@/lib/meta-config";
import { isMetaCapiConfigured, sendMetaConnectionTest } from "@/lib/meta-capi";
import {
  getMetaLeadQualityStats,
  syncMetaLeadQualityForContact,
} from "@/lib/meta-lead-quality";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getMetaLeadQualityStats();
    return NextResponse.json({
      ...stats,
      configured: isMetaCapiConfigured(),
      datasetId: getMetaDatasetId(),
      expectedDatasetId: META_DATASET_ID,
      hasToken: hasMetaCapiToken(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load Meta stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isInboxAuthed(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.test === true) {
      const result = await sendMetaConnectionTest();
      return NextResponse.json({
        status: result.ok ? "success" : "error",
        datasetId: result.datasetId,
        error: result.error,
        response: result.response,
        hint: result.ok
          ? "Check Events Manager → Test events (or Overview in ~15 min)."
          : "Add META_CAPI_ACCESS_TOKEN in Vercel, redeploy, then try again.",
      });
    }

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
