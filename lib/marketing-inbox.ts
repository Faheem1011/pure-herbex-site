import { kv } from "@vercel/kv";
import type { InboxLine } from "@/lib/inbox-line";
import { normalizePhone } from "@/lib/blocked";
import {
  activeContactsKey,
  contactKey,
  marketingContactKey,
  marketingContactsKey,
  migrationFlagKey,
} from "@/lib/kv-keys";

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
    isVoiceNote?: boolean;
    replyTo?: string;
    location?: Record<string, unknown>;
    isDeleted?: boolean;
    deliveryError?: string;
    deliveryErrorCode?: number;
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
  message: MarketingContact["messages"][0],
  line: InboxLine = "main"
) {
  const normalized = normalizePhone(phone);
  const key = marketingContactKey(line, normalized);
  let contact = (await kv.get(key)) as MarketingContact | null;
  if (!contact) {
    contact = { name: name || "Lead", phone: normalized, messages: [] };
  } else if (name && contact.name === "Lead") {
    contact.name = name;
  }

  const exists = contact.messages.some((m) => m.id === message.id);
  if (!exists) {
    contact.messages.push(message);
  }

  await kv.set(key, contact);
  await kv.sadd(marketingContactsKey(line), normalized);
}

export async function isMarketingLead(
  phone: string,
  line: InboxLine = "main"
): Promise<boolean> {
  return !!(await kv.sismember(marketingContactsKey(line), normalizePhone(phone)));
}

export async function getMarketingContact(
  phone: string,
  line: InboxLine = "main"
): Promise<MarketingContact | null> {
  return (await kv.get(marketingContactKey(line, phone))) as MarketingContact | null;
}

export async function getAllMarketingContacts(
  line: InboxLine = "main"
): Promise<MarketingContact[]> {
  const phones: string[] = await kv.smembers(marketingContactsKey(line));
  if (!phones.length) return [];

  const keys = phones.map((p) => marketingContactKey(line, p));
  const data = await kv.mget(keys);
  return (data.filter(Boolean) as MarketingContact[]).sort((a, b) => {
    const aTime = a.messages[a.messages.length - 1]?.timestamp || 0;
    const bTime = b.messages[b.messages.length - 1]?.timestamp || 0;
    return bTime - aTime;
  });
}

export async function saveMarketingContact(
  contact: MarketingContact,
  line: InboxLine = "main"
) {
  const normalized = normalizePhone(contact.phone);
  contact.phone = normalized;
  await kv.set(marketingContactKey(line, normalized), contact);
  await kv.sadd(marketingContactsKey(line), normalized);
}

/** Move legacy marketing-only threads out of the main inbox (runs once). */
export async function migrateMarketingOnlyFromMain(line: InboxLine = "main"): Promise<void> {
  if (await kv.get(migrationFlagKey(line))) return;

  const activeNumbers: string[] = await kv.smembers(activeContactsKey(line));
  for (const phone of activeNumbers) {
    const main = await kv.get(contactKey(line, phone));
    if (!main || !isMarketingOnlyMainContact(main)) continue;

    const existing = await getMarketingContact(phone, line);
    if (!existing) {
      await kv.set(marketingContactKey(line, phone), {
        ...(main as MarketingContact),
        phone: normalizePhone(phone),
      });
      await kv.sadd(marketingContactsKey(line), normalizePhone(phone));
    }

    await kv.srem(activeContactsKey(line), phone);
    await kv.del(contactKey(line, phone));
  }

  await kv.set(migrationFlagKey(line), true);
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
