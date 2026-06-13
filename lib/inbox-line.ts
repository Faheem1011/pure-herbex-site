export type InboxLine = "main" | "us";

export function parseInboxLine(value: string | null | undefined): InboxLine {
  if (value === "us") return "us";
  return "main";
}

export function kvPrefix(line: InboxLine = "main"): string {
  return line === "us" ? "whatsapp:us:" : "whatsapp:";
}

export function getWhatsAppPhoneNumberIdForLine(line: InboxLine = "main"): string {
  if (line === "us") {
    const id = process.env.WHATSAPP_PHONE_NUMBER_ID_2?.trim();
    if (!id) {
      throw new Error("WHATSAPP_PHONE_NUMBER_ID_2 is not configured for the US inbox");
    }
    return id;
  }
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!id) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured");
  }
  return id;
}

export function lineFromPhoneNumberId(phoneNumberId: string | undefined): InboxLine | null {
  if (!phoneNumberId) return "main";
  const main = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const us = process.env.WHATSAPP_PHONE_NUMBER_ID_2?.trim();
  if (us && phoneNumberId === us) return "us";
  if (main && phoneNumberId === main) return "main";
  if (!us && main) return "main";
  return null;
}

export function inboxLineLabel(line: InboxLine): string {
  return line === "us" ? "US Inbox (+1)" : "Main Inbox";
}

export function withLineQuery(path: string, line: InboxLine): string {
  if (line === "main") return path;
  return path.includes("?") ? `${path}&line=us` : `${path}?line=us`;
}
