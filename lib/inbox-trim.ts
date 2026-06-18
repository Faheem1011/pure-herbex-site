import type { Contact } from "@/app/inbox/types";
import { normalizePhone } from "@/lib/blocked";
import { mergeOutboundDeliveryStatus } from "@/lib/message-status";

/** Default recent thread kept in list sync (enough to follow context). */
export const SYNC_KEEP_DEFAULT = 20;
/** Unread / pinned chats get a deeper slice without full history. */
export const SYNC_KEEP_PRIORITY = 40;
/** Marketing / campaign list — lighter slice. */
export const SYNC_KEEP_CAMPAIGN = 15;

export type TrimSyncOptions = {
  /** Open chat — always send full message history. */
  activePhone?: string;
  isCampaign?: boolean;
};

function keepCountForContact(
  contact: Contact,
  options?: TrimSyncOptions
): number | null {
  const active = options?.activePhone
    ? normalizePhone(options.activePhone)
    : "";
  if (active && contact.phone === active) return null;

  if (options?.isCampaign) return SYNC_KEEP_CAMPAIGN;
  if (contact.hasUnread || contact.pinned) return SYNC_KEEP_PRIORITY;
  return SYNC_KEEP_DEFAULT;
}

export function trimContactForList<T extends Contact>(
  contact: T,
  options?: TrimSyncOptions
): T & { _totalMessages?: number } {
  const keep = keepCountForContact(contact, options);
  if (keep === null) return contact;

  const messages = contact.messages;
  const total = messages?.length ?? 0;
  if (!messages || total <= keep) {
    return contact;
  }
  return {
    ...contact,
    messages: messages.slice(-keep),
    _totalMessages: total,
  };
}

export function trimContactsForList(
  contacts: Contact[],
  options?: TrimSyncOptions
): Contact[] {
  return contacts.map((c) => trimContactForList(c, options));
}

/** Merge trimmed server sync into local state; keep full history when already loaded. */
export function mergeContactFromSync(
  server: Contact,
  local: Contact | undefined,
  isOpen: boolean
): Contact {
  if (!local) return server;

  const serverMsgs = server.messages || [];
  const localMsgs = local.messages || [];
  const serverTotal =
    (server as Contact & { _totalMessages?: number })._totalMessages ??
    serverMsgs.length;

  let messages = localMsgs;
  if (localMsgs.length > serverMsgs.length) {
    const localIds = new Set(localMsgs.map((m) => m.id));
    const appended = serverMsgs.filter((m) => !localIds.has(m.id));
    messages = mergeOutboundDeliveryStatus(localMsgs, serverMsgs);
    if (appended.length) {
      messages = [...messages, ...appended].sort(
        (a, b) => a.timestamp - b.timestamp
      );
    }
  } else if (
    serverMsgs.length > localMsgs.length ||
    serverTotal > localMsgs.length
  ) {
    messages = serverMsgs;
  } else {
    messages = mergeOutboundDeliveryStatus(localMsgs, serverMsgs);
  }

  const merged: Contact = {
    ...server,
    messages,
    tag: server.tag ?? local.tag,
  };
  if (serverTotal > messages.length) {
    (merged as Contact & { _totalMessages?: number })._totalMessages = serverTotal;
  } else {
    delete (merged as Contact & { _totalMessages?: number })._totalMessages;
  }
  return merged;
}

export function contactNeedsFullHistory(
  contact: Contact,
  loadedPhones: Set<string>
): boolean {
  if (loadedPhones.has(contact.phone)) return false;
  const total = (contact as Contact & { _totalMessages?: number })._totalMessages;
  if (total != null && total > (contact.messages?.length ?? 0)) return true;
  return false;
}

export function countHiddenMessages(contact: Contact): number {
  const total = (contact as Contact & { _totalMessages?: number })._totalMessages;
  const shown = contact.messages?.length ?? 0;
  if (total != null && total > shown) return total - shown;
  return 0;
}
