import { kv } from "@vercel/kv";
import type { InboxLine } from "@/lib/inbox-line";
import { normalizePhone } from "@/lib/blocked";
import {
  activeContactsKey,
  contactKey,
  marketingContactKey,
  marketingContactsKey,
} from "@/lib/kv-keys";

function contactHasMediaId(contact: unknown, mediaId: string): boolean {
  const messages = (contact as { messages?: Array<{ mediaId?: string; isDeleted?: boolean }> })
    ?.messages;
  return (
    messages?.some((m) => m.mediaId === mediaId && !m.isDeleted) ?? false
  );
}

async function isKnownInboxMediaForLine(
  mediaId: string,
  line: InboxLine
): Promise<boolean> {
  const mainPhones: string[] = (await kv.smembers(activeContactsKey(line))) || [];
  for (const phone of mainPhones) {
    const contact = await kv.get(contactKey(line, phone));
    if (contactHasMediaId(contact, mediaId)) {
      return true;
    }
  }

  const marketingPhones: string[] =
    (await kv.smembers(marketingContactsKey(line))) || [];
  for (const phone of marketingPhones) {
    const contact = await kv.get(marketingContactKey(line, normalizePhone(phone)));
    if (contactHasMediaId(contact, mediaId)) {
      return true;
    }
  }

  return false;
}

/** Media IDs already stored in inbox KV (img/video tags cannot send Authorization headers). */
export async function isKnownInboxMedia(mediaId: string): Promise<boolean> {
  if (await isKnownInboxMediaForLine(mediaId, "main")) return true;
  if (process.env.WHATSAPP_PHONE_NUMBER_ID_2) {
    return isKnownInboxMediaForLine(mediaId, "us");
  }
  return false;
}
