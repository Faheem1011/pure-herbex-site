import { kv } from "@vercel/kv";

const STATUS_KEY = "whatsapp:status_items";
const PUBLIC_MEDIA_SET = "whatsapp:public_status_media";

type StatusItem = {
  mediaId: string;
  expiresAt: number;
};

export async function registerPublicStatusMedia(mediaId: string): Promise<void> {
  if (!mediaId) return;
  await kv.sadd(PUBLIC_MEDIA_SET, mediaId);
}

export async function isPublicStatusMedia(mediaId: string): Promise<boolean> {
  if (!mediaId) return false;

  const inSet = await kv.sismember(PUBLIC_MEDIA_SET, mediaId);
  if (inSet) return true;

  const items: StatusItem[] = (await kv.get(STATUS_KEY)) || [];
  const now = Date.now();
  const active = items.some((item) => item.expiresAt > now && item.mediaId === mediaId);

  if (active) {
    await kv.sadd(PUBLIC_MEDIA_SET, mediaId);
    return true;
  }

  return false;
}
