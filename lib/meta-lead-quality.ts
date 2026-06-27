import { kv } from "@/lib/kv";
import { normalizePhone } from "@/lib/blocked";
import type { OrderStatus } from "@/lib/crm-types";
import {
  isMetaCapiConfigured,
  sendMetaCapiEvent,
  type MetaCapiEventName,
} from "@/lib/meta-capi";

const STATS_KEY = "meta:capi:stats";
const SENT_PREFIX = "meta:capi:sent:";
const DEFAULT_ORDER_VALUE = 3000;

export type AdReferral = {
  ctwaClid?: string;
  sourceId?: string;
  sourceType?: string;
  sourceUrl?: string;
  capturedAt?: number;
};

export type MetaLeadQualityStats = {
  enabled: boolean;
  qualified: number;
  unqualified: number;
  purchases: number;
  adLeads: number;
  errors: number;
  skippedNoAdClick: number;
  lastEventAt?: number;
  lastError?: string;
  lastSkipReason?: string;
};

type StatsRecord = MetaLeadQualityStats;

function defaultStats(): StatsRecord {
  return {
    enabled: isMetaCapiConfigured(),
    qualified: 0,
    unqualified: 0,
    purchases: 0,
    adLeads: 0,
    errors: 0,
    skippedNoAdClick: 0,
  };
}

async function loadStats(): Promise<StatsRecord> {
  const stored = (await kv.get(STATS_KEY)) as StatsRecord | null;
  return { ...defaultStats(), ...(stored || {}) };
}

async function saveStats(stats: StatsRecord): Promise<void> {
  await kv.set(STATS_KEY, { ...stats, enabled: isMetaCapiConfigured() });
}

async function markSent(eventId: string): Promise<boolean> {
  const key = `${SENT_PREFIX}${eventId}`;
  const exists = await kv.get(key);
  if (exists) return false;
  await kv.set(key, Date.now());
  return true;
}

async function recordSuccess(
  bucket: keyof Pick<StatsRecord, "qualified" | "unqualified" | "purchases" | "adLeads">
): Promise<void> {
  const stats = await loadStats();
  stats[bucket] += 1;
  stats.lastEventAt = Date.now();
  stats.enabled = isMetaCapiConfigured();
  await saveStats(stats);
}

async function recordError(message: string): Promise<void> {
  const stats = await loadStats();
  stats.errors += 1;
  stats.lastError = message.slice(0, 240);
  stats.lastEventAt = Date.now();
  await saveStats(stats);
}

async function recordSkip(reason: string): Promise<void> {
  const stats = await loadStats();
  stats.skippedNoAdClick += 1;
  stats.lastSkipReason = reason.slice(0, 240);
  stats.lastEventAt = Date.now();
  await saveStats(stats);
}

export type MetaTagSendResult = {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  eventName?: MetaCapiEventName;
};

async function emitEvent(params: {
  eventName: MetaCapiEventName;
  eventId: string;
  phone: string;
  name?: string;
  value?: number;
  ctwaClid?: string;
  customData?: Record<string, string | number>;
  statsBucket?: keyof Pick<StatsRecord, "qualified" | "unqualified" | "purchases" | "adLeads">;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isMetaCapiConfigured()) {
    return { ok: false, skipped: true, error: "Meta CAPI not configured" };
  }

  const shouldSend = await markSent(params.eventId);
  if (!shouldSend) {
    return { ok: true, skipped: true };
  }

  const result = await sendMetaCapiEvent({
    eventName: params.eventName,
    eventId: params.eventId,
    user: {
      phone: params.phone,
      name: params.name,
      ctwaClid: params.ctwaClid,
    },
    value: params.value,
    customData: params.customData,
  });

  if (result.ok) {
    if (params.statsBucket) {
      await recordSuccess(params.statsBucket);
    }
    return { ok: true };
  }

  if (result.skipped) {
    await kv.del(`${SENT_PREFIX}${params.eventId}`);
    await recordSkip(result.error || "Event skipped");
    return { ok: false, skipped: true, error: result.error };
  }

  await kv.del(`${SENT_PREFIX}${params.eventId}`);
  await recordError(result.error || "Unknown Meta CAPI error");
  return { ok: false, error: result.error };
}

export function parseAdReferral(raw: unknown): AdReferral | undefined {
  const ref = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!ref) return undefined;
  const ctwaClid = typeof ref.ctwa_clid === "string" ? ref.ctwa_clid : undefined;
  const sourceId = typeof ref.source_id === "string" ? ref.source_id : undefined;
  const sourceType = typeof ref.source_type === "string" ? ref.source_type : undefined;
  const sourceUrl = typeof ref.source_url === "string" ? ref.source_url : undefined;
  if (!ctwaClid && !sourceId && !sourceType) return undefined;
  return {
    ctwaClid,
    sourceId,
    sourceType,
    sourceUrl,
    capturedAt: Date.now(),
  };
}

export async function getMetaLeadQualityStats(): Promise<MetaLeadQualityStats> {
  return loadStats();
}

/** First message from a Click-to-WhatsApp ad. */
export async function notifyMetaAdLead(params: {
  phone: string;
  name?: string;
  referral?: AdReferral;
}): Promise<void> {
  const phone = normalizePhone(params.phone);
  if (!phone) return;
  await emitEvent({
    eventName: "LeadSubmitted",
    eventId: `lead-${phone}`,
    phone,
    name: params.name,
    ctwaClid: params.referral?.ctwaClid,
    customData: {
      lead_source: "whatsapp_ad",
      ad_id: params.referral?.sourceId || "",
    },
    statsBucket: "adLeads",
  });
}

/** Tag changed — tell Meta if lead is real (Confirm). Spam/block do not send events. */
export async function notifyMetaContactTagged(params: {
  phone: string;
  name?: string;
  tag: string | null;
  adReferral?: AdReferral;
}): Promise<MetaTagSendResult> {
  const phone = normalizePhone(params.phone);
  if (!phone || !params.tag) {
    return { sent: false, skipped: true, reason: "No tag" };
  }

  if (params.tag === "Confirm") {
    if (!params.adReferral?.ctwaClid) {
      await recordSkip("Confirm skipped — contact did not come from a Facebook/WhatsApp ad");
      return {
        sent: false,
        skipped: true,
        reason:
          "This contact did not come from a Facebook ad click. Meta only accepts events for ad leads.",
      };
    }

    const result = await emitEvent({
      eventName: "QualifiedLead",
      eventId: `qualified-${phone}`,
      phone,
      name: params.name,
      value: DEFAULT_ORDER_VALUE,
      ctwaClid: params.adReferral.ctwaClid,
      customData: { lead_quality: "qualified", inbox_tag: "Confirm" },
      statsBucket: "qualified",
    });
    if (result.ok) {
      return { sent: true, eventName: "QualifiedLead" };
    }
    return {
      sent: false,
      skipped: result.skipped,
      reason: result.error || "Meta rejected event",
      eventName: "QualifiedLead",
    };
  }

  if (params.tag === "Spam") {
    return {
      sent: false,
      skipped: true,
      reason: "Meta WhatsApp CAPI has no spam/unqualified event — use Confirm on real ad leads instead.",
    };
  }

  return { sent: false, skipped: true, reason: "Tag not sent to Meta" };
}

export async function notifyMetaContactBlocked(params: {
  phone: string;
  name?: string;
  blocked: boolean;
  adReferral?: AdReferral;
}): Promise<MetaTagSendResult> {
  if (!params.blocked) {
    return { sent: false, skipped: true, reason: "Not blocked" };
  }

  return {
    sent: false,
    skipped: true,
    reason:
      "Block does not send to Meta. Meta WhatsApp CAPI only accepts positive signals (Confirm, Delivered).",
  };
}

/** Order confirmed or delivered — real purchase signal for ad optimization. */
export async function notifyMetaOrderStatus(params: {
  phone: string;
  customerName?: string;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  amount?: number;
  orderId?: string;
  adReferral?: AdReferral;
}): Promise<void> {
  const phone = normalizePhone(params.phone);
  if (!phone) return;

  const value = params.amount ?? DEFAULT_ORDER_VALUE;
  const orderKey = params.orderId || phone;

  if (params.status === "confirmed" && params.previousStatus !== "confirmed") {
    await emitEvent({
      eventName: "InitiateCheckout",
      eventId: `order-confirmed-${orderKey}`,
      phone,
      name: params.customerName,
      value,
      ctwaClid: params.adReferral?.ctwaClid,
      customData: { lead_quality: "confirmed_order" },
      statsBucket: "qualified",
    });
  }

  if (params.status === "delivered" && params.previousStatus !== "delivered") {
    await emitEvent({
      eventName: "Purchase",
      eventId: `purchase-${orderKey}`,
      phone,
      name: params.customerName,
      value,
      ctwaClid: params.adReferral?.ctwaClid,
      customData: { lead_quality: "delivered" },
      statsBucket: "purchases",
    });
  }

  if (
    (params.status === "cancelled" || params.status === "returned") &&
    params.previousStatus !== params.status
  ) {
    await emitEvent({
      eventName: params.status === "cancelled" ? "OrderCanceled" : "OrderReturned",
      eventId: `order-${params.status}-${orderKey}`,
      phone,
      name: params.customerName,
      value: 0,
      ctwaClid: params.adReferral?.ctwaClid,
      customData: { lead_quality: params.status },
      statsBucket: "unqualified",
    });
  }
}

/** Manual re-send for one contact (inbox UI). */
export async function syncMetaLeadQualityForContact(contact: {
  phone: string;
  name?: string;
  tag?: string | null;
  blocked?: boolean;
  adReferral?: AdReferral;
}): Promise<{ results: string[] }> {
  const results: string[] = [];
  const phone = normalizePhone(contact.phone);
  if (!phone) return { results: ["Invalid phone"] };

  if (contact.adReferral?.ctwaClid) {
    const r = await emitEvent({
      eventName: "LeadSubmitted",
      eventId: `lead-resync-${phone}-${Date.now()}`,
      phone,
      name: contact.name,
      ctwaClid: contact.adReferral.ctwaClid,
      statsBucket: "adLeads",
    });
    results.push(r.ok ? "Lead sent" : r.error || "Lead failed");
  }

  if (contact.tag) {
    await notifyMetaContactTagged({
      phone,
      name: contact.name,
      tag: contact.tag,
      adReferral: contact.adReferral,
    });
    results.push(`Tag ${contact.tag} processed`);
  }

  if (contact.blocked) {
    await notifyMetaContactBlocked({
      phone,
      name: contact.name,
      blocked: true,
      adReferral: contact.adReferral,
    });
    results.push("Blocked signal sent");
  }

  return { results };
}
