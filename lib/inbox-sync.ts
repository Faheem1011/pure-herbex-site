import { kv } from "@vercel/kv";
import type { InboxLine } from "@/lib/inbox-line";
import { normalizePhone } from "@/lib/blocked";
import { getAllMarketingContacts } from "@/lib/marketing-inbox";
import {
  activeContactsKey,
  contactKey,
  inboxVersionKey,
} from "@/lib/kv-keys";

export async function getInboxVersion(line: InboxLine = "main"): Promise<number> {
  const v = await kv.get(inboxVersionKey(line));
  return typeof v === "number" ? v : Number(v) || 0;
}

export async function bumpInboxVersion(line: InboxLine = "main"): Promise<number> {
  return kv.incr(inboxVersionKey(line));
}

export async function fetchMainContacts(line: InboxLine = "main") {
  const activeNumbers: string[] = await kv.smembers(activeContactsKey(line));
  if (activeNumbers.length === 0) return [];

  const contactKeys = activeNumbers.map((phone) =>
    contactKey(line, normalizePhone(phone))
  );
  const contactsData = await kv.mget(contactKeys);
  return contactsData.filter((c) => c !== null);
}

export async function fetchInboxSnapshot(line: InboxLine = "main") {
  const [contacts, campaignContacts] = await Promise.all([
    fetchMainContacts(line),
    getAllMarketingContacts(line),
  ]);
  const version = await getInboxVersion(line);
  return { version, contacts, campaignContacts, line };
}
