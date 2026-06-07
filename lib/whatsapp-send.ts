import { getWhatsAppAccessToken, getWhatsAppPhoneNumberId } from "@/lib/whatsapp";
import { normalizePhone } from "@/lib/blocked";

type SendResult = { ok: boolean; msgId?: string; error?: string };

export async function sendWhatsAppMediaMessage(
  toPhone: string,
  type: "image" | "video",
  mediaId: string,
  caption?: string
): Promise<SendResult> {
  const to = normalizePhone(toPhone);
  const url = `https://graph.facebook.com/v20.0/${getWhatsAppPhoneNumberId()}/messages`;

  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type,
    [type]: {
      id: mediaId,
      ...(caption ? { caption } : {}),
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getWhatsAppAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    return { ok: false, error: data.error?.message || "Failed to send message" };
  }

  return { ok: true, msgId: data.messages?.[0]?.id };
}
