export type ReadableMessage = {
  id?: string;
  sender: "me" | "them";
  isDeleted?: boolean;
  readByAgent?: boolean;
};

export type ReadableContact = {
  messages?: ReadableMessage[];
  unreadCount?: number;
  hasUnread?: boolean;
};

export function recomputeUnread(contact: ReadableContact): void {
  const unread = (contact.messages || []).filter(
    (m) => m.sender === "them" && !m.isDeleted && m.readByAgent === false
  ).length;
  contact.unreadCount = unread;
  contact.hasUnread = unread > 0;
}

export function markAllMessagesRead(contact: ReadableContact): void {
  for (const msg of contact.messages || []) {
    if (msg.sender === "them" && !msg.isDeleted) {
      msg.readByAgent = true;
    }
  }
  recomputeUnread(contact);
}

export function markAllMessagesUnread(contact: ReadableContact): void {
  for (const msg of contact.messages || []) {
    if (msg.sender === "them" && !msg.isDeleted) {
      msg.readByAgent = false;
    }
  }
  recomputeUnread(contact);
}

export function setMessageReadState(
  contact: ReadableContact,
  messageId: string,
  read: boolean
): boolean {
  const msg = (contact.messages || []).find((m) => m.id === messageId);
  if (!msg || msg.sender !== "them" || msg.isDeleted) {
    return false;
  }
  msg.readByAgent = read;
  recomputeUnread(contact);
  return true;
}

export function isMessageUnread(msg: ReadableMessage): boolean {
  return msg.sender === "them" && !msg.isDeleted && msg.readByAgent === false;
}
