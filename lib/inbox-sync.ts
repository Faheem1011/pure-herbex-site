import { kv } from "@vercel/kv";
import { normalizePhone } from "@/lib/blocked";
import { getAllMarketingContacts } from "@/lib/marketing-inbox";

export const INBOX_VERSION_KEY = "whatsapp:inbox_version";

export async function getInboxVersion(): Promise<number> {
  const v = await kv.get(INBOX_VERSION_KEY);
  return typeof v === "number" ? v : Number(v) || 0;
}

export async function bumpInboxVersion(): Promise<number> {
  return kv.incr(INBOX_VERSION_KEY);
}

export async function fetchMainContacts() {
  const activeNumbers: string[] = await kv.smembers("whatsapp:active_contacts");
  if (activeNumbers.length === 0) return [];

  const contactKeys = activeNumbers.map((phone) => `whatsapp:contact:${normalizePhone(phone)}`);
  const contactsData = await kv.mget(contactKeys);
  return contactsData.filter((c) => c !== null);
}

export async function fetchInboxSnapshot() {
  const [contacts, campaignContacts] = await Promise.all([
    fetchMainContacts(),
    getAllMarketingContacts(),
  ]);
  const version = await getInboxVersion();
  return { version, contacts, campaignContacts };
}
