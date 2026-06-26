import { createHash } from "crypto";
import { normalizePhone } from "@/lib/blocked";
import { getMetaDatasetId, hasMetaCapiToken } from "@/lib/meta-config";
import { WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

export type MetaCapiEventName =
  | "Lead"
  | "InitiateCheckout"
  | "Purchase"
  | "UnqualifiedLead";

export type MetaCapiUser = {
  phone: string;
  name?: string;
  country?: string;
  ctwaClid?: string;
};

export type MetaCapiEventInput = {
  eventName: MetaCapiEventName;
  eventId: string;
  user: MetaCapiUser;
  value?: number;
  currency?: string;
  customData?: Record<string, string | number>;
};

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** E.164 digits for Pakistan (Meta requires country code, no +). */
export function phoneForMeta(phone: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return "";
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

function hashPhone(phone: string): string | undefined {
  const e164 = phoneForMeta(phone);
  return e164 ? sha256(e164) : undefined;
}

function hashNamePart(name: string): string | undefined {
  const part = name.trim().toLowerCase();
  return part ? sha256(part) : undefined;
}

export function isMetaCapiConfigured(): boolean {
  return !!(getMetaDatasetId() && hasMetaCapiToken());
}

async function postMetaEvents(body: Record<string, unknown>): Promise<{
  ok: boolean;
  error?: string;
  response?: unknown;
}> {
  const pixelId = getMetaDatasetId();
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: false, error: "META_CAPI_ACCESS_TOKEN not configured" };
  }

  const testCode = process.env.META_TEST_EVENT_CODE?.trim();
  const payload: Record<string, unknown> = {
    ...body,
    access_token: token,
  };
  if (testCode) {
    payload.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${pixelId}/events`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data as { error?: { message?: string } })?.error?.message ||
        `Meta CAPI HTTP ${res.status}`;
      return { ok: false, error: msg, response: data };
    }
    return { ok: true, response: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Meta CAPI request failed",
    };
  }
}

/** Ping Meta to verify dataset + token (shows in Events Manager → Test events if code set). */
export async function sendMetaConnectionTest(): Promise<{
  ok: boolean;
  error?: string;
  response?: unknown;
  datasetId: string;
}> {
  const datasetId = getMetaDatasetId();
  const result = await postMetaEvents({
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `phx-connection-test-${Date.now()}`,
        action_source: "business_messaging",
        messaging_channel: "whatsapp",
        user_data: {
          country: [createHash("sha256").update("pk").digest("hex")],
        },
        custom_data: {
          source: "pure_herbex_inbox",
          test: "connection_check",
        },
      },
    ],
  });
  return { ...result, datasetId };
}

export async function sendMetaCapiEvent(
  input: MetaCapiEventInput
): Promise<{ ok: boolean; error?: string; response?: unknown }> {
  if (!hasMetaCapiToken()) {
    return { ok: false, error: "META_CAPI_ACCESS_TOKEN not configured" };
  }

  const ph = hashPhone(input.user.phone);
  if (!ph) {
    return { ok: false, error: "Invalid phone for Meta CAPI" };
  }

  const userData: Record<string, string[]> = {
    ph: [ph],
    country: [sha256((input.user.country || "pk").toLowerCase())],
  };

  const firstName = input.user.name?.trim().split(/\s+/)[0];
  const fn = firstName ? hashNamePart(firstName) : undefined;
  if (fn) userData.fn = [fn];

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "business_messaging",
    messaging_channel: "whatsapp",
    user_data: userData,
  };

  if (input.user.ctwaClid) {
    event.ctwa_clid = input.user.ctwaClid;
  }

  const custom: Record<string, string | number> = {
    ...(input.customData || {}),
  };
  if (input.value != null) {
    custom.value = input.value;
    custom.currency = input.currency || "PKR";
  }
  if (Object.keys(custom).length > 0) {
    event.custom_data = custom;
  }

  return postMetaEvents({ data: [event] });
}
