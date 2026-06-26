import { kv } from "@/lib/kv";
import { isPhoneBlocked } from "@/lib/blocked";
import type { InboxLine } from "@/lib/inbox-line";
import { bumpInboxVersion, fetchMainContacts } from "@/lib/inbox-sync";
import { activeContactsKey, contactKey } from "@/lib/kv-keys";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp-send";
import {
  getLastIncomingTimestamp,
  shouldSendWindowFollowup,
  WINDOW_FOLLOWUP_MESSAGE,
  type WindowContact,
} from "@/lib/window-24h";

const MAX_PER_RUN = 30;

export type FollowupRunResult = {
  scanned: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ phone: string; error: string }>;
};

export async function runWindowFollowups(
  line: InboxLine = "main"
): Promise<FollowupRunResult> {
  const contacts = (await fetchMainContacts(line)) as WindowContact[];
  const result: FollowupRunResult = {
    scanned: contacts.length,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  let sentThisRun = 0;

  for (const raw of contacts) {
    if (sentThisRun >= MAX_PER_RUN) break;

    const phone = raw.phone;
    if (!phone) {
      result.skipped++;
      continue;
    }

    if (!shouldSendWindowFollowup(raw)) {
      result.skipped++;
      continue;
    }

    if (await isPhoneBlocked(phone, line)) {
      result.skipped++;
      continue;
    }

    result.eligible++;

    const windowStart = getLastIncomingTimestamp(raw);
    if (windowStart === null) {
      result.skipped++;
      continue;
    }

    const sendResult = await sendWhatsAppTextMessage(
      phone,
      WINDOW_FOLLOWUP_MESSAGE,
      line
    );

    if (!sendResult.ok) {
      result.failed++;
      result.errors.push({ phone, error: sendResult.error || "Send failed" });
      continue;
    }

    const storageKey = contactKey(line, phone);
    const contact: WindowContact & { messages: Array<Record<string, unknown>> } =
      (await kv.get(storageKey)) || {
        name: raw.name || "WhatsApp Contact",
        phone,
        messages: [],
      };

    if (!contact.messages) contact.messages = [];

    contact.followupSentForWindow = windowStart;
    contact.messages.push({
      id: sendResult.msgId || `followup-${Date.now()}`,
      sender: "me",
      text: WINDOW_FOLLOWUP_MESSAGE,
      timestamp: Math.floor(Date.now() / 1000),
      status: "sent",
      type: "auto_followup",
    });

    await kv.set(storageKey, contact);
    await kv.sadd(activeContactsKey(line), phone);
    await bumpInboxVersion(line);

    result.sent++;
    sentThisRun++;
  }

  return result;
}
