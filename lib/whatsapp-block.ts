import type { InboxLine } from "@/lib/inbox-line";
import { getWhatsAppPhoneNumberIdForLine } from "@/lib/inbox-line";
import { normalizePhone } from "@/lib/blocked";
import { getWhatsAppAccessToken, WHATSAPP_GRAPH_API_VERSION } from "@/lib/whatsapp";

export type WhatsAppBlockResult = {
  ok: boolean;
  waId?: string;
  error?: string;
  code?: number;
};

function formatUserPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return "";
  return digits.startsWith("+") ? digits : digits;
}

async function blockUsersRequest(
  phones: string[],
  line: InboxLine,
  method: "POST" | "DELETE"
): Promise<WhatsAppBlockResult[]> {
  const users = phones.map((p) => formatUserPhone(p)).filter(Boolean);
  if (!users.length) {
    return [{ ok: false, error: "Invalid phone" }];
  }

  let phoneNumberId: string;
  let token: string;
  try {
    phoneNumberId = getWhatsAppPhoneNumberIdForLine(line);
    token = getWhatsAppAccessToken();
  } catch (err) {
    return [
      {
        ok: false,
        error: err instanceof Error ? err.message : "WhatsApp not configured",
      },
    ];
  }

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${phoneNumberId}/block_users`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        block_users: users.map((user) => ({ user })),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      block_users?: {
        added_users?: Array<{ input?: string; wa_id?: string }>;
        removed_users?: Array<{ input?: string; wa_id?: string }>;
        failed_users?: Array<{
          input?: string;
          wa_id?: string;
          errors?: Array<{ message?: string; code?: number }>;
        }>;
      };
      error?: { message?: string; code?: number };
    };

    const successList =
      method === "POST"
        ? data.block_users?.added_users
        : data.block_users?.removed_users;
    const failedList = data.block_users?.failed_users || [];

    const results: WhatsAppBlockResult[] = [];

    for (const entry of successList || []) {
      results.push({
        ok: true,
        waId: entry.wa_id,
      });
    }

    for (const entry of failedList) {
      const err = entry.errors?.[0];
      results.push({
        ok: false,
        waId: entry.wa_id,
        error: err?.message || data.error?.message || "Block API failed",
        code: err?.code ?? data.error?.code,
      });
    }

    if (!results.length) {
      if (!res.ok) {
        return [
          {
            ok: false,
            error: data.error?.message || `HTTP ${res.status}`,
            code: data.error?.code,
          },
        ];
      }
      return users.map(() => ({ ok: true }));
    }

    return results;
  } catch (err) {
    return [
      {
        ok: false,
        error: err instanceof Error ? err.message : "Block request failed",
      },
    ];
  }
}

/** Block on WhatsApp servers — user cannot message your business. */
export async function blockWhatsAppUser(
  phone: string,
  line: InboxLine = "main"
): Promise<WhatsAppBlockResult> {
  const [result] = await blockUsersRequest([phone], line, "POST");
  return result || { ok: false, error: "No response" };
}

/** Remove WhatsApp platform block. */
export async function unblockWhatsAppUser(
  phone: string,
  line: InboxLine = "main"
): Promise<WhatsAppBlockResult> {
  const [result] = await blockUsersRequest([phone], line, "DELETE");
  return result || { ok: false, error: "No response" };
}
