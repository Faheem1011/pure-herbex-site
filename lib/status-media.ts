import { kv } from "@vercel/kv";

const STATUS_KEY = "whatsapp:status_items";

type StatusItem = {
  mediaId: string;
  expiresAt: number;
};

export async function isPublicStatusMedia(mediaId: string): Promise<boolean> {
  const items: StatusItem[] = (await kv.get(STATUS_KEY)) || [];
  const now = Date.now();
  return items.some((item) => item.expiresAt > now && item.mediaId === mediaId);
}
