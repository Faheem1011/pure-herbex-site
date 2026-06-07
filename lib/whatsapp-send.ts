import { getWhatsAppAccessToken, getWhatsAppPhoneNumberId } from "@/lib/whatsapp";
import { normalizePhone } from "@/lib/blocked";

type SendResult = { ok: boolean; msgId?: string; error?: string };

export const DEFAULT_TEMPLATE_IMAGE =
  "https://pure-herbex-site.vercel.app/assets/images/product-bottle.png";

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

export async function sendWhatsAppTemplateMessage(
  toPhone: string,
  templateName: string,
  options: {
    languageCode?: string;
    bodyVarCount?: number;
    name?: string;
    city?: string;
    headerImageUrl?: string;
  } = {}
): Promise<SendResult> {
  const {
    languageCode = "en",
    bodyVarCount = 0,
    name = "",
    city = "",
    headerImageUrl,
  } = options;

  const to = normalizePhone(toPhone);
  const components: Record<string, unknown>[] = [];

  const imageUrl = headerImageUrl || DEFAULT_TEMPLATE_IMAGE;
  if (templateName === "herbex_marketing" || headerImageUrl) {
    components.push({
      type: "header",
      parameters: [{ type: "image", image: { link: imageUrl } }],
    });
  }

  const bodyParams: { type: "text"; text: string }[] = [];
  if (bodyVarCount >= 1) bodyParams.push({ type: "text", text: name });
  if (bodyVarCount >= 2) bodyParams.push({ type: "text", text: city });
  if (bodyParams.length > 0) {
    components.push({ type: "body", parameters: bodyParams });
  }

  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: languageCode },
  };
  if (components.length > 0) template.components = components;

  const url = `https://graph.facebook.com/v20.0/${getWhatsAppPhoneNumberId()}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getWhatsAppAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { ok: false, error: data.error?.message || "Failed to send template" };
  }

  return { ok: true, msgId: data.messages?.[0]?.id };
}
