import { kv } from "@/lib/kv";
import type { InboxLine } from "@/lib/inbox-line";
import { kvPrefix } from "@/lib/inbox-line";
import {
  activeContactsKey,
  contactKey,
  marketingContactKey,
  marketingContactsKey,
} from "@/lib/kv-keys";
import { normalizePhone } from "@/lib/blocked";

function mediaIndexKey(line: InboxLine): string {
  return `${kvPrefix(line)}known_media_ids`;
}

function mediaIndexFlagKey(line: InboxLine): string {
  return `${kvPrefix(line)}media_index_v1`;
}

export async function registerKnownMediaId(
  mediaId: string | undefined | null,
  line: InboxLine = "main"
): Promise<void> {
  if (!mediaId) return;
  await kv.sadd(mediaIndexKey(line), mediaId);
}

export async function registerKnownMediaIds(
  mediaIds: Array<string | undefined | null>,
  line: InboxLine = "main"
): Promise<void> {
  const unique = [...new Set(mediaIds.filter((id): id is string => !!id))];
  if (unique.length === 0) return;
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    if (chunk.length === 1) {
      await kv.sadd(mediaIndexKey(line), chunk[0]);
    } else {
      await kv.sadd(mediaIndexKey(line), ...(chunk as [string, ...string[]]));
    }
  }
}

/** O(1) check — replaces scanning every contact on each /api/media request. */
export async function isKnownInboxMedia(mediaId: string): Promise<boolean> {
  if (!mediaId) return false;
  if (await kv.sismember(mediaIndexKey("main"), mediaId)) return true;
  if (process.env.WHATSAPP_PHONE_NUMBER_ID_2) {
    if (await kv.sismember(mediaIndexKey("us"), mediaId)) return true;
  }
  return false;
}

function collectMediaIds(contact: unknown): string[] {
  const messages = (contact as { messages?: Array<{ mediaId?: string; isDeleted?: boolean }> })
    ?.messages;
  if (!messages?.length) return [];
  return messages
    .filter((m) => m.mediaId && !m.isDeleted)
    .map((m) => m.mediaId as string);
}

/** One-time backfill so existing chats don't trigger full scans. */
export async function ensureMediaIndexBuilt(line: InboxLine = "main"): Promise<void> {
  if (await kv.get(mediaIndexFlagKey(line))) return;

  const ids = new Set<string>();
  const mainPhones: string[] = (await kv.smembers(activeContactsKey(line))) || [];
  if (mainPhones.length) {
    const keys = mainPhones.map((phone) => contactKey(line, normalizePhone(phone)));
    const contacts = await kv.mget(keys);
    for (const contact of contacts) {
      for (const id of collectMediaIds(contact)) ids.add(id);
    }
  }

  const marketingPhones: string[] = (await kv.smembers(marketingContactsKey(line))) || [];
  if (marketingPhones.length) {
    const keys = marketingPhones.map((p) => marketingContactKey(line, p));
    const contacts = await kv.mget(keys);
    for (const contact of contacts) {
      for (const id of collectMediaIds(contact)) ids.add(id);
    }
  }

  if (ids.size > 0) {
    await registerKnownMediaIds([...ids], line);
  }
  await kv.set(mediaIndexFlagKey(line), true);
}
