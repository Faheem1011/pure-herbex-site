import { kv } from "@vercel/kv";
import { MARKETING_CONTACTS_SET } from "@/lib/marketing-inbox";
import { normalizePhone } from "@/lib/blocked";

function contactHasMediaId(contact: unknown, mediaId: string): boolean {
  const messages = (contact as { messages?: Array<{ mediaId?: string; isDeleted?: boolean }> })
    ?.messages;
  return (
    messages?.some((m) => m.mediaId === mediaId && !m.isDeleted) ?? false
  );
}

/** Media IDs already stored in inbox KV (img/video tags cannot send Authorization headers). */
export async function isKnownInboxMedia(mediaId: string): Promise<boolean> {
  const mainPhones: string[] =
    (await kv.smembers("whatsapp:active_contacts")) || [];
  for (const phone of mainPhones) {
    const contact = await kv.get(`whatsapp:contact:${phone}`);
    if (contactHasMediaId(contact, mediaId)) {
      return true;
    }
  }

  const marketingPhones: string[] =
    (await kv.smembers(MARKETING_CONTACTS_SET)) || [];
  for (const phone of marketingPhones) {
    const contact = await kv.get(
      `whatsapp:marketing_contact:${normalizePhone(phone)}`
    );
    if (contactHasMediaId(contact, mediaId)) {
      return true;
    }
  }

  return false;
}
