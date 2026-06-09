/** Parse WhatsApp Cloud API webhook message objects into inbox-friendly content. */

export type ParsedWebhookMessage = {
  text: string;
  type: string;
  mediaId?: string;
  fileName?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  isVoiceNote?: boolean;
  /** Meta/system messages the API cannot show in full (verification codes, etc.) */
  systemKind?: "meta_verification" | "unsupported" | "reaction" | "system";
  unsupportedCode?: number;
};

/** Meta / WhatsApp automated sender numbers (verification, alerts). */
const META_SYSTEM_SENDERS = new Set([
  "13135550002",
  "12485302709",
  "16505551111",
]);

type WebhookError = {
  code?: number;
  title?: string;
  message?: string;
  error_data?: { details?: string };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isMetaSystemSender(from: string, profileName?: string): boolean {
  const digits = from.replace(/\D/g, "");
  if (META_SYSTEM_SENDERS.has(digits)) return true;
  const name = (profileName || "").toLowerCase();
  return (
    name.includes("whatsapp") ||
    name === "facebook" ||
    name.includes("meta") ||
    name.includes("verification")
  );
}

function parseUnsupportedMessage(
  message: Record<string, unknown>,
  from: string,
  profileName?: string,
  businessPhone?: string
): ParsedWebhookMessage {
  const errors = (message.errors as WebhookError[] | undefined) || [];
  const code = errors[0]?.code;
  const details =
    errors[0]?.error_data?.details || errors[0]?.title || errors[0]?.message || "";

  const isVerification =
    isMetaSystemSender(from, profileName) ||
    /verification|confirm|authentication|otp|one.?time/i.test(details);

  if (isVerification) {
    const phoneHint = businessPhone ? ` (${businessPhone})` : "";
    return {
      type: "system",
      systemKind: "meta_verification",
      unsupportedCode: code,
      text:
        "🔐 WhatsApp / Meta verification message\n\n" +
        "Meta sent a confirmation code to your WhatsApp number, but the Business API cannot display this message type.\n\n" +
        `➡ Open the WhatsApp app on your phone${phoneHint}, read the code in that chat, then enter it in Facebook Business Settings.`,
    };
  }

  const reason = details ? ` (${details})` : code ? ` (error ${code})` : "";
  return {
    type: "system",
    systemKind: "unsupported",
    unsupportedCode: code,
    text:
      `⚠️ Unsupported message${reason}\n\n` +
      "WhatsApp sent a message type the Business API cannot show (polls, GIFs, edited messages, or some system messages). " +
      "Ask the sender to resend as plain text if you need the content.",
  };
}

export function parseWebhookMessage(
  message: Record<string, unknown>,
  options?: { profileName?: string; businessPhone?: string }
): ParsedWebhookMessage {
  const from = str(message.from);
  const profileName = options?.profileName;
  const msgType = str(message.type) || "text";

  let text = str(asRecord(message.text)?.body);
  let mediaId = "";
  let fileName = "";
  let location: ParsedWebhookMessage["location"];
  let isVoiceNote: boolean | undefined;

  if (msgType === "image") {
    const image = asRecord(message.image);
    mediaId = str(image?.id);
    text = str(image?.caption) || "📷 Photo";
  } else if (msgType === "audio" || msgType === "voice") {
    const voice = asRecord(message.voice);
    const audio = asRecord(message.audio);
    mediaId = str(voice?.id) || str(audio?.id);
    text = "🎤 Voice Note";
    isVoiceNote = true;
  } else if (msgType === "video") {
    const video = asRecord(message.video);
    mediaId = str(video?.id);
    text = str(video?.caption) || "🎥 Video";
  } else if (msgType === "document") {
    const doc = asRecord(message.document);
    mediaId = str(doc?.id);
    fileName = str(doc?.filename);
    text = fileName ? `📄 File: ${fileName}` : "📄 File";
  } else if (msgType === "sticker") {
    mediaId = str(asRecord(message.sticker)?.id);
    text = "🎭 Sticker";
  } else if (msgType === "location") {
    const loc = asRecord(message.location);
    const lat = Number(loc?.latitude);
    const lng = Number(loc?.longitude);
    location = {
      latitude: lat,
      longitude: lng,
      name: str(loc?.name),
      address: str(loc?.address),
    };
    text = location.name ? `📍 Location: ${location.name}` : "📍 Location";
  } else if (msgType === "interactive") {
    const interactive = asRecord(message.interactive);
    const kind = str(interactive?.type);
    if (kind === "button_reply") {
      const reply = asRecord(interactive?.button_reply);
      text = `🔘 ${str(reply?.title) || "Button reply"}`;
    } else if (kind === "list_reply") {
      const reply = asRecord(interactive?.list_reply);
      const title = str(reply?.title);
      const description = str(reply?.description);
      text = description ? `📋 ${title}: ${description}` : `📋 ${title || "List reply"}`;
    } else if (kind === "nfm_reply") {
      text = "📋 Form response";
    } else {
      text = `💬 Interactive: ${kind || "response"}`;
    }
  } else if (msgType === "button") {
    const button = asRecord(message.button);
    text = `🔘 ${str(button?.text) || str(button?.payload) || "Quick reply"}`;
  } else if (msgType === "contacts") {
    const contacts = (message.contacts as Array<Record<string, unknown>>) || [];
    const first = contacts[0];
    const name = asRecord(first?.name);
    const formatted = (name?.formatted_name as string) || (name?.first_name as string) || "Contact";
    text = contacts.length > 1 ? `👤 ${formatted} +${contacts.length - 1} more` : `👤 ${formatted}`;
  } else if (msgType === "reaction") {
    const reaction = asRecord(message.reaction);
    const emoji = str(reaction?.emoji) || "👍";
    return {
      type: "system",
      systemKind: "reaction",
      text: `${emoji} Reacted to a message`,
    };
  } else if (msgType === "order") {
    text = "🛒 Order received";
  } else if (msgType === "system") {
    const system = asRecord(message.system);
    const body = str(system?.body) || str(system?.type) || "System update";
    return {
      type: "system",
      systemKind: "system",
      text: `ℹ️ ${body}`,
    };
  } else if (msgType === "unsupported") {
    return parseUnsupportedMessage(message, from, profileName, options?.businessPhone);
  } else if (!text) {
    text = `(${msgType} message)`;
  }

  return {
    text,
    type: msgType === "voice" ? "voice" : msgType,
    mediaId: mediaId || undefined,
    fileName: fileName || undefined,
    location,
    isVoiceNote,
  };
}
