import { kv } from "@vercel/kv";
import { normalizePhone } from "@/lib/blocked";

export const MARKETING_CONTACTS_SET = "whatsapp:marketing_contacts";
const marketingKey = (phone: string) => `whatsapp:marketing_contact:${normalizePhone(phone)}`;

export type MarketingContact = {
  name: string;
  phone: string;
  messages: Array<{
    id: string;
    sender: "me" | "them";
    text: string;
    timestamp: number;
    status?: string;
    type?: string;
    mediaId?: string;
    fileName?: string;
    replyTo?: string;
    location?: Record<string, unknown>;
    isDeleted?: boolean;
  }>;
  unreadCount?: number;
  hasUnread?: boolean;
  archived?: boolean;
};

function isMarketingOnlyMainContact(contact: any): boolean {
  if (!contact?.messages?.length) return false;
  return !contact.messages.some((m: any) => m.sender === "them");
}

export async function registerMarketingContact(
  phone: string,
  name: string,
  message: MarketingContact["messages"][0]
) {
  const normalized = normalizePhone(phone);
  let contact = (await kv.get(marketingKey(normalized))) as MarketingContact | null;
  if (!contact) {
    contact = { name: name || "Lead", phone: normalized, messages: [] };
  } else if (name && contact.name === "Lead") {
    contact.name = name;
  }

  const exists = contact.messages.some((m) => m.id === message.id);
  if (!exists) {
    contact.messages.push(message);
  }

  await kv.set(marketingKey(normalized), contact);
  await kv.sadd(MARKETING_CONTACTS_SET, normalized);
}

export async function isMarketingLead(phone: string): Promise<boolean> {
  return !!(await kv.sismember(MARKETING_CONTACTS_SET, normalizePhone(phone)));
}

export async function getMarketingContact(phone: string): Promise<MarketingContact | null> {
  return (await kv.get(marketingKey(phone))) as MarketingContact | null;
}

export async function getAllMarketingContacts(): Promise<MarketingContact[]> {
  const phones: string[] = await kv.smembers(MARKETING_CONTACTS_SET);
  if (!phones.length) return [];

  const keys = phones.map((p) => marketingKey(p));
  const data = await kv.mget(keys);
  return (data.filter(Boolean) as MarketingContact[]).sort((a, b) => {
    const aTime = a.messages[a.messages.length - 1]?.timestamp || 0;
    const bTime = b.messages[b.messages.length - 1]?.timestamp || 0;
    return bTime - aTime;
  });
}

export async function saveMarketingContact(contact: MarketingContact) {
  const normalized = normalizePhone(contact.phone);
  contact.phone = normalized;
  await kv.set(marketingKey(normalized), contact);
  await kv.sadd(MARKETING_CONTACTS_SET, normalized);
}

const MIGRATION_FLAG = "whatsapp:migration_v1_complete";

/** Move legacy marketing-only threads out of the main inbox (runs once). */
export async function migrateMarketingOnlyFromMain(): Promise<void> {
  if (await kv.get(MIGRATION_FLAG)) return;

  const activeNumbers: string[] = await kv.smembers("whatsapp:active_contacts");
  for (const phone of activeNumbers) {
    const main = await kv.get(`whatsapp:contact:${phone}`);
    if (!main || !isMarketingOnlyMainContact(main)) continue;

    const existing = await getMarketingContact(phone);
    if (!existing) {
      await kv.set(marketingKey(phone), {
        ...(main as MarketingContact),
        phone: normalizePhone(phone),
      });
      await kv.sadd(MARKETING_CONTACTS_SET, normalizePhone(phone));
    }

    await kv.srem("whatsapp:active_contacts", phone);
    await kv.del(`whatsapp:contact:${phone}`);
  }

  await kv.set(MIGRATION_FLAG, true);
}

export function shouldUseMainInboxForIncoming(
  mainContact: any | null,
  fromMarketing: boolean
): boolean {
  if (mainContact?.messages?.some((m: any) => m.sender === "them")) {
    return true;
  }
  return !fromMarketing;
}
