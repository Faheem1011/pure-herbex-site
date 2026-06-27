import { NextRequest, NextResponse } from "next/server";
import { isInboxAuthed } from "@/lib/auth";
import { normalizePhone } from "@/lib/blocked";
import { kv } from "@/lib/kv";
import { contactKey } from "@/lib/kv-keys";
import { resolveInboxLine } from "@/lib/inbox-request";
import { getMetaCapiAccessToken, hasMetaCapiToken } from "@/lib/meta-config";
import { isMetaCapiConfigured, sendMetaConnectionTest } from "@/lib/meta-capi";
import {
  META_BUSINESS_DATASET_ID,
  META_WA_EVENT_DATASET_ID,
  META_WEB_PIXEL_ID,
  resolveMetaCapiDataset,
} from "@/lib/meta-dataset";
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

    const resolved = await resolveMetaCapiDataset();
    const stats = await getMetaLeadQualityStats();
    return NextResponse.json({
      ...stats,
      configured: isMetaCapiConfigured(),
      datasetId: resolved.datasetId,
      wabaId: resolved.wabaId,
      datasetSource: resolved.source,
      businessPortfolioId: META_BUSINESS_DATASET_ID,
      waEventDatasetId: META_WA_EVENT_DATASET_ID,
      webPixelId: META_WEB_PIXEL_ID,
      hasToken: hasMetaCapiToken(),
      resolveNote: resolved.error,
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
        wabaId: result.wabaId,
        error: result.error,
        hint: result.hint,
        response: result.response,
        help: result.ok
          ? "Open Events Manager → WhatsApp Marketing Messages dataset → Test events."
          : result.hint ||
            "Use WHATSAPP_ACCESS_TOKEN (with whatsapp_business_manage_events) or a System User token in META_CAPI_ACCESS_TOKEN.",
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
