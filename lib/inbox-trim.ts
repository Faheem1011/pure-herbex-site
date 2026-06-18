import type { Contact } from "@/app/inbox/types";

const LIST_PREVIEW_MESSAGES = 2;

export function trimContactForList<T extends { messages?: Contact["messages"] }>(
  contact: T,
  keep = LIST_PREVIEW_MESSAGES
): T & { _totalMessages?: number } {
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

export function trimContactsForList(contacts: Contact[]): Contact[] {
  return contacts.map((c) => trimContactForList(c));
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
    if (appended.length) {
      messages = [...localMsgs, ...appended].sort(
        (a, b) => a.timestamp - b.timestamp
      );
    }
  } else if (serverMsgs.length > localMsgs.length || serverTotal > localMsgs.length) {
    messages = serverMsgs;
  }

  const merged: Contact = {
    ...server,
    messages,
    tag: server.tag ?? local.tag,
  };
  delete (merged as Contact & { _totalMessages?: number })._totalMessages;
  return merged;
}

export function contactNeedsFullHistory(
  contact: Contact,
  loadedPhones: Set<string>
): boolean {
  if (loadedPhones.has(contact.phone)) return false;
  const total =
    (contact as Contact & { _totalMessages?: number })._totalMessages;
  if (total != null && total > (contact.messages?.length ?? 0)) return true;
  return false;
}
