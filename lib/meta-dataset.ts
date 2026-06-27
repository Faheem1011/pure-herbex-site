import { getMetaCapiAccessToken } from "@/lib/meta-config";
import { kv } from "@/lib/kv";
import { getWhatsAppPhoneNumberId } from "@/lib/whatsapp";
import { WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

const CACHE_KEY = "meta:capi:resolved";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** WhatsApp Marketing Message Event Sharing dataset (Events Manager URL id). */
export const META_WA_EVENT_DATASET_ID = "2315143692344751";

/** Business portfolio id shown on Pure Herbex card — NOT the CAPI events endpoint. */
export const META_BUSINESS_DATASET_ID = "1887451258612774";

/** Website Meta Pixel (pureherbex.com browser tracking — separate from WhatsApp CAPI). */
export const META_WEB_PIXEL_ID = "1041872258371374";

type CachedResolution = {
  datasetId: string;
  wabaId: string;
  cachedAt: number;
};

/** PK WhatsApp Business Account (316 line). US WABA: 1307951640969306. */
export const META_PK_WABA_ID = "873082805829474";

export function getWabaIdFromEnv(): string | undefined {
  return process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || META_PK_WABA_ID;
}

async function fetchJson(url: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

async function resolveWabaId(token: string): Promise<string | undefined> {
  const fromEnv = getWabaIdFromEnv();
  if (fromEnv) return fromEnv;

  const phoneId = getWhatsAppPhoneNumberId();
  const data = await fetchJson(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${phoneId}?fields=whatsapp_business_account`,
    token
  );
  const waba = data.whatsapp_business_account;
  if (typeof waba === "string") return waba;
  if (waba && typeof waba === "object" && "id" in waba) {
    return String((waba as { id: string }).id);
  }
  return undefined;
}

async function fetchDatasetForWaba(wabaId: string, token: string): Promise<string | undefined> {
  const data = await fetchJson(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${wabaId}/dataset`,
    token
  );
  if (typeof data.id === "string") return data.id;
  const nested = data.data;
  if (Array.isArray(nested) && nested[0]?.id) {
    return String(nested[0].id);
  }
  return undefined;
}

/** Resolve the dataset id Meta accepts for POST /{id}/events (WhatsApp business messaging). */
export async function resolveMetaCapiDataset(): Promise<{
  datasetId: string;
  wabaId?: string;
  source: "env" | "cache" | "waba_api" | "fallback";
  error?: string;
}> {
  const explicit =
    process.env.META_CAPI_DATASET_ID?.trim() ||
    process.env.META_DATASET_ID?.trim();
  if (explicit && explicit !== META_BUSINESS_DATASET_ID) {
    return { datasetId: explicit, wabaId: getWabaIdFromEnv(), source: "env" };
  }

  const cached = (await kv.get(CACHE_KEY)) as CachedResolution | null;
  if (cached?.datasetId && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      datasetId: cached.datasetId,
      wabaId: cached.wabaId,
      source: "cache",
    };
  }

  const token = getMetaCapiAccessToken();
  if (!token) {
    return {
      datasetId: META_WA_EVENT_DATASET_ID,
      source: "fallback",
      error: "No access token — using default WhatsApp dataset id",
    };
  }

  try {
    const wabaId = await resolveWabaId(token);
    if (!wabaId) {
      return {
        datasetId: META_WA_EVENT_DATASET_ID,
        source: "fallback",
        error: "Could not resolve WhatsApp Business Account id",
      };
    }

    const datasetId = await fetchDatasetForWaba(wabaId, token);
    if (!datasetId) {
      return {
        datasetId: META_WA_EVENT_DATASET_ID,
        wabaId,
        source: "fallback",
        error: "WABA dataset API returned no id — using default",
      };
    }

    await kv.set(CACHE_KEY, {
      datasetId,
      wabaId,
      cachedAt: Date.now(),
    } satisfies CachedResolution);

    return { datasetId, wabaId, source: "waba_api" };
  } catch (err) {
    return {
      datasetId: META_WA_EVENT_DATASET_ID,
      source: "fallback",
      error: err instanceof Error ? err.message : "Dataset resolution failed",
    };
  }
}
