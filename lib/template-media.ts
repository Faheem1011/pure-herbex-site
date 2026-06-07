import { readFile } from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { getWhatsAppAccessToken, getWhatsAppPhoneNumberId } from "@/lib/whatsapp";

const KV_KEY = "whatsapp:template_header_media";
const MEDIA_MAX_AGE_MS = 25 * 24 * 60 * 60 * 1000; // re-upload before Meta's ~30-day expiry

type CachedMedia = { id: string; uploadedAt: number };

export const MARKETING_HEADER_IMAGE_PATH = path.join(
  process.cwd(),
  "public",
  "assets",
  "images",
  "marketing-header.jpg"
);

export const MARKETING_HEADER_IMAGE_URL =
  "https://pure-herbex-site.vercel.app/assets/images/marketing-header.jpg";

async function uploadImageToMeta(buffer: Buffer, filename: string): Promise<string> {
  const blob = new Blob([buffer], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", new File([blob], filename, { type: "image/jpeg" }), filename);
  formData.append("type", "image");

  const uploadUrl = `https://graph.facebook.com/v20.0/${getWhatsAppPhoneNumberId()}/media`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${getWhatsAppAccessToken()}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.id) {
    throw new Error(data.error?.message || "Failed to upload template header to Meta");
  }

  return data.id as string;
}

export async function getTemplateHeaderMediaId(): Promise<string> {
  const cached = (await kv.get(KV_KEY)) as CachedMedia | null;
  if (cached?.id && Date.now() - cached.uploadedAt < MEDIA_MAX_AGE_MS) {
    return cached.id;
  }

  const buffer = await readFile(MARKETING_HEADER_IMAGE_PATH);
  const mediaId = await uploadImageToMeta(buffer, "marketing-header.jpg");

  await kv.set(KV_KEY, { id: mediaId, uploadedAt: Date.now() } satisfies CachedMedia);
  return mediaId;
}
