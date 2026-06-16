import { kv } from "@vercel/kv";
import type { InboxLine } from "@/lib/inbox-line";
import { kvPrefix } from "@/lib/inbox-line";
import { normalizePhone } from "@/lib/blocked";
import { getAllMarketingContacts } from "@/lib/marketing-inbox";
import {
  activeContactsKey,
  contactKey,
  inboxVersionKey,
} from "@/lib/kv-keys";

const VERSION_BUMP_THROTTLE_MS = 10_000;

function versionThrottleKey(line: InboxLine): string {
  return `${kvPrefix(line)}version_bump_at`;
}

export async function getInboxVersion(line: InboxLine = "main"): Promise<number> {
  const v = await kv.get(inboxVersionKey(line));
  return typeof v === "number" ? v : Number(v) || 0;
}

export async function bumpInboxVersion(line: InboxLine = "main"): Promise<number> {
  return kv.incr(inboxVersionKey(line));
}

/** Coalesce rapid webhook status updates so open inboxes don't full-sync constantly. */
export async function bumpInboxVersionThrottled(
  line: InboxLine = "main",
  throttleMs = VERSION_BUMP_THROTTLE_MS
): Promise<number> {
  const throttleKey = versionThrottleKey(line);
  const last = Number(await kv.get(throttleKey)) || 0;
  const now = Date.now();
  if (now - last < throttleMs) {
    return getInboxVersion(line);
  }
  await kv.set(throttleKey, now);
  return bumpInboxVersion(line);
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

export async function fetchInboxSnapshot(line: InboxLine = "main", knownVersion?: number) {
  const [contacts, campaignContacts, version] = await Promise.all([
    fetchMainContacts(line),
    getAllMarketingContacts(line),
    knownVersion !== undefined ? Promise.resolve(knownVersion) : getInboxVersion(line),
  ]);
  return { version, contacts, campaignContacts, line };
}