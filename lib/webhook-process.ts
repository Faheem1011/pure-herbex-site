import { kv } from "@vercel/kv";
import { isPhoneBlocked, normalizePhone } from "@/lib/blocked";
import { bumpInboxVersion } from "@/lib/inbox-sync";
import {
  isMarketingLead,
  saveMarketingContact,
  shouldUseMainInboxForIncoming,
  type MarketingContact,
} from "@/lib/marketing-inbox";
import { parseWebhookMessage } from "@/lib/parse-webhook-message";
import { recomputeUnread, type ReadableContact } from "@/lib/read-state";

type WebhookValue = {
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  messages?: Array<Record<string, unknown>>;
  statuses?: Array<Record<string, unknown>>;
};

function profileNameFor(value: WebhookValue, waId: string): string {
  return (
    value.contacts?.find((c) => c.wa_id === waId)?.profile?.name ||
    value.contacts?.[0]?.profile?.name ||
    "WhatsApp Contact"
  );
}

export async function processIncomingWebhookMessage(
  value: WebhookValue,
  message: Record<string, unknown>
): Promise<void> {
  const rawFrom = message.from as string | undefined;
  const from = rawFrom ? normalizePhone(rawFrom) : "";
  if (!from) return;

  if (await isPhoneBlocked(from)) return;

  const timestamp = (message.timestamp as number) || Math.floor(Date.now() / 1000);
  const msgId = message.id as string;
  const profileName = profileNameFor(value, rawFrom || from);
  const parsed = parseWebhookMessage(message, {
    profileName,
    businessPhone: value.metadata?.display_phone_number,
  });

  const replyToId = (message.context as { id?: string } | undefined)?.id;

  const incomingMsg = {
    id: msgId,
    sender: "them" as const,
    text: parsed.text,
    timestamp: parseInt(String(timestamp), 10),
    status: "received",
    type: parsed.type,
    mediaId: parsed.mediaId,
    replyTo: replyToId,
    fileName: parsed.fileName,
    location: parsed.location,
    isVoiceNote: parsed.isVoiceNote,
    systemKind: parsed.systemKind,
    unsupportedCode: parsed.unsupportedCode,
    readByAgent: false,
  };

  const mainContact: { messages?: Array<{ id: string }> } | null = await kv.get(
    `whatsapp:contact:${from}`
  );
  const fromMarketing = await isMarketingLead(from);
  const useMain = shouldUseMainInboxForIncoming(mainContact, fromMarketing);
  if (useMain) {
    let contact: {
      name: string;
      phone: string;
      messages: Array<{ id: string }>;
      unreadCount?: number;
      hasUnread?: boolean;
    } = mainContact
      ? { ...mainContact, name: (mainContact as { name?: string }).name || profileName, phone: from, messages: mainContact.messages || [] }
      : { name: profileName, phone: from, messages: [] };

    if (!contact.messages.some((m) => m.id === msgId)) {
      contact.messages.push(incomingMsg);
      recomputeUnread(contact as unknown as ReadableContact);
      await kv.set(`whatsapp:contact:${from}`, contact);
      await kv.sadd("whatsapp:active_contacts", from);
      await bumpInboxVersion();
    }
  } else {
    let contact: MarketingContact | null = await kv.get(
      `whatsapp:marketing_contact:${from}`
    );
    if (!contact) {
      contact = { name: profileName, phone: from, messages: [] };
    }
    if (!contact.messages.some((m) => m.id === msgId)) {
      contact.messages.push(incomingMsg);
      recomputeUnread(contact as unknown as ReadableContact);
      await saveMarketingContact(contact);
      await bumpInboxVersion();
    }
  }
}

export async function processIncomingWebhookStatus(
  status: Record<string, unknown>
): Promise<void> {
  const recipient_id = normalizePhone(status.recipient_id as string);
  if (!recipient_id) return;

  const msg_id = status.id as string;
  const msg_status = status.status as string;
  const errors = status.errors as Array<{ code?: number; title?: string; message?: string }> | undefined;
  const errorCode = errors?.[0]?.code;
  const errorTitle = errors?.[0]?.title || errors?.[0]?.message;

  const updateMessageStatus = async (contact: unknown, storageKey: string) => {
    const record = contact as { messages?: Array<Record<string, unknown>> } | null;
    if (!record?.messages) return false;
    let updated = false;
    for (const msg of record.messages) {
      if (msg.id === msg_id) {
        msg.status = msg_status;
        if (msg_status === "failed") {
          msg.deliveryError = errorTitle || "Delivery failed";
          if (errorCode != null) msg.deliveryErrorCode = errorCode;
        } else {
          delete msg.deliveryError;
          delete msg.deliveryErrorCode;
        }
        updated = true;
        break;
      }
    }
    if (updated) {
      await kv.set(storageKey, record);
    }
    return updated;
  };

  const mainKey = `whatsapp:contact:${recipient_id}`;
  const marketingKey = `whatsapp:marketing_contact:${recipient_id}`;
  const mainContact = await kv.get(mainKey);
  const marketingContact = await kv.get(marketingKey);
  const updatedMain = await updateMessageStatus(mainContact, mainKey);
  const updatedMarketing = updatedMain
    ? false
    : await updateMessageStatus(marketingContact, marketingKey);

  if (updatedMain || updatedMarketing) {
    await bumpInboxVersion();
  }

  if (msg_status === "failed") {
    const campaignStatus: Record<string, Record<string, unknown>> =
      (await kv.get("whatsapp:campaign_status")) || {};
    const entry = campaignStatus[recipient_id];
    if (entry?.messageId === msg_id || entry?.status === "sent") {
      let failureNote = errorTitle || "Delivery failed";
      if (errorCode === 130472) {
        failureNote =
          "Meta experiment: user cannot receive marketing until they message you first (error 130472)";
      } else if (errorCode === 131053 || (errorTitle && /media/i.test(errorTitle))) {
        failureNote =
          "Media delivery failed — compress video to under 4 MB MP4, or resend from inbox (error 131053)";
      }
      campaignStatus[recipient_id] = {
        ...entry,
        status: "failed",
        error: failureNote,
        failedAt: Date.now(),
      };
      await kv.set("whatsapp:campaign_status", campaignStatus);
      await bumpInboxVersion();
    }
  }
}
