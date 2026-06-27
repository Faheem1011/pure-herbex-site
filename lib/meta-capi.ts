import { createHash } from "crypto";
import { normalizePhone } from "@/lib/blocked";
import { getMetaCapiAccessToken, getMetaFacebookPageId } from "@/lib/meta-config";
import { resolveMetaCapiDataset } from "@/lib/meta-dataset";
import { WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

/** Internal event names used by inbox logic. */
export type MetaCapiEventName =
  | "LeadSubmitted"
  | "QualifiedLead"
  | "InitiateCheckout"
  | "Purchase"
  | "OrderCanceled"
  | "OrderReturned";

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
    page_id: getMetaFacebookPageId(),
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

async function verifyMetaToken(): Promise<{
  ok: boolean;
  name?: string;
  id?: string;
  error?: string;
}> {
  const token = getMetaCapiAccessToken();
  if (!token) {
    return { ok: false, error: "Access token not configured" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/me?fields=id,name`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      name?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: data.error?.message || `Graph API HTTP ${res.status}` };
    }
    return { ok: true, id: data.id, name: data.name };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Token verification failed",
    };
  }
}

/** Verify token + dataset access. Real events need ctwa_clid from ad clicks. */
export async function sendMetaConnectionTest(): Promise<{
  ok: boolean;
  error?: string;
  response?: unknown;
  datasetId: string;
  wabaId?: string;
  hint?: string;
  tokenName?: string;
}> {
  const resolved = await resolveMetaCapiDataset();
  const tokenCheck = await verifyMetaToken();

  if (!tokenCheck.ok) {
    let hint =
      "Token is invalid or expired. Generate a new System User token in Meta Business Suite → System users → Generate token, paste the Conversions API System User token in Vercel.";
    if (tokenCheck.error?.toLowerCase().includes("malformed")) {
      hint =
        "Token paste is corrupted (extra spaces/quotes). Re-paste with no quotes into META_CAPI_ACCESS_TOKEN, then redeploy.";
    }
    return {
      ok: false,
      error: tokenCheck.error,
      datasetId: resolved.datasetId,
      wabaId: resolved.wabaId,
      hint,
    };
  }

  const datasetProbe = await fetch(
    `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${resolved.datasetId}?fields=name`,
    { headers: { Authorization: `Bearer ${getMetaCapiAccessToken()}` } }
  );
  const datasetData = (await datasetProbe.json().catch(() => ({}))) as {
    name?: string;
    error?: { message?: string };
  };

  if (!datasetProbe.ok) {
    return {
      ok: false,
      error: datasetData.error?.message || "Cannot access WhatsApp dataset",
      datasetId: resolved.datasetId,
      wabaId: resolved.wabaId,
      tokenName: tokenCheck.name,
      hint:
        "Token lacks whatsapp_business_manage_events. Regenerate the System User token with that permission.",
    };
  }

  return {
    ok: true,
    datasetId: resolved.datasetId,
    wabaId: resolved.wabaId,
    tokenName: tokenCheck.name,
    response: {
      token: tokenCheck.name,
      dataset: datasetData.name,
      pageId: getMetaFacebookPageId(),
    },
    hint:
      "Token and dataset OK. Live events send when someone clicks your WhatsApp ad (ctwa_clid is captured automatically). Tag Confirm or mark Delivered to send QualifiedLead / Purchase.",
  };
}

export async function sendMetaCapiEvent(
  input: MetaCapiEventInput
): Promise<{ ok: boolean; error?: string; response?: unknown; skipped?: boolean }> {
  if (!getMetaCapiAccessToken()) {
    return { ok: false, error: "Access token not configured" };
  }

  if (!input.user.ctwaClid) {
    return {
      ok: false,
      skipped: true,
      error: "No ctwa_clid — contact did not come from a Click-to-WhatsApp ad",
    };
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
