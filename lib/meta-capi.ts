import { createHash } from "crypto";
import { normalizePhone } from "@/lib/blocked";
import { getMetaCapiAccessToken } from "@/lib/meta-config";
import { resolveMetaCapiDataset } from "@/lib/meta-dataset";
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
  wabaId?: string;
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
  return !!getMetaCapiAccessToken();
}

async function postMetaEvents(body: Record<string, unknown>): Promise<{
  ok: boolean;
  error?: string;
  response?: unknown;
  datasetId?: string;
  wabaId?: string;
}> {
  const token = getMetaCapiAccessToken();
  if (!token) {
    return { ok: false, error: "META_CAPI_ACCESS_TOKEN / WHATSAPP_ACCESS_TOKEN not configured" };
  }

  const resolved = await resolveMetaCapiDataset();
  const datasetId = resolved.datasetId;

  const testCode = process.env.META_TEST_EVENT_CODE?.trim();
  const payload: Record<string, unknown> = {
    ...body,
    access_token: token,
  };
  if (testCode) {
    payload.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${datasetId}/events`;

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
      return {
        ok: false,
        error: msg,
        response: data,
        datasetId,
        wabaId: resolved.wabaId,
      };
    }
    return { ok: true, response: data, datasetId, wabaId: resolved.wabaId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Meta CAPI request failed",
      datasetId,
      wabaId: resolved.wabaId,
    };
  }
}

function buildUserData(input: MetaCapiUser, wabaId?: string): Record<string, string | string[]> {
  const userData: Record<string, string | string[]> = {
    country: [sha256((input.country || "pk").toLowerCase())],
  };

  const ph = hashPhone(input.phone);
  if (ph) userData.ph = [ph];

  const firstName = input.name?.trim().split(/\s+/)[0];
  const fn = firstName ? hashNamePart(firstName) : undefined;
  if (fn) userData.fn = [fn];

  const waba = input.wabaId || wabaId;
  if (waba) {
    userData.whatsapp_business_account_id = waba;
  }

  if (input.ctwaClid) {
    userData.ctwa_clid = input.ctwaClid;
  }

  return userData;
}

/** Ping Meta to verify dataset + token. */
export async function sendMetaConnectionTest(): Promise<{
  ok: boolean;
  error?: string;
  response?: unknown;
  datasetId: string;
  wabaId?: string;
  hint?: string;
}> {
  const resolved = await resolveMetaCapiDataset();
  const result = await postMetaEvents({
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `phx-connection-test-${Date.now()}`,
        action_source: "business_messaging",
        messaging_channel: "whatsapp",
        user_data: buildUserData({ phone: "923001234567", country: "pk" }, resolved.wabaId),
        custom_data: {
          source: "pure_herbex_inbox",
          test: "connection_check",
        },
      },
    ],
  });

  let hint: string | undefined;
  if (!result.ok && result.error?.toLowerCase().includes("malformed access token")) {
    hint =
      "Token is invalid or expired. Generate a NEW token in Meta → WhatsApp → API Setup, paste with no quotes/spaces into WHATSAPP_ACCESS_TOKEN and META_CAPI_ACCESS_TOKEN, then redeploy.";
  } else if (!result.ok && result.error?.includes("does not exist")) {
    hint =
      "Token lacks whatsapp_business_manage_events. In Meta Developer App → Permissions, request Advanced Access for whatsapp_business_manage_events, then regenerate token.";
  }

  return {
    ok: result.ok,
    error: result.error,
    response: result.response,
    datasetId: result.datasetId || resolved.datasetId,
    wabaId: result.wabaId || resolved.wabaId,
    hint,
  };
}

export async function sendMetaCapiEvent(
  input: MetaCapiEventInput
): Promise<{ ok: boolean; error?: string; response?: unknown }> {
  if (!getMetaCapiAccessToken()) {
    return { ok: false, error: "Access token not configured" };
  }

  const resolved = await resolveMetaCapiDataset();

  const custom: Record<string, string | number> = {
    ...(input.customData || {}),
  };
  if (input.value != null) {
    custom.value = input.value;
    custom.currency = input.currency || "PKR";
  }

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "business_messaging",
    messaging_channel: "whatsapp",
    user_data: buildUserData(
      { ...input.user, wabaId: input.user.wabaId || resolved.wabaId },
      resolved.wabaId
    ),
  };

  if (Object.keys(custom).length > 0) {
    event.custom_data = custom;
  }

  return postMetaEvents({ data: [event] });
}
