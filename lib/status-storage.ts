import { kv } from "@vercel/kv";

const STATUS_KEY = "whatsapp:status_items";
const MAX_STATUS_BYTES = 10 * 1024 * 1024;

type StoredStatusFile = {
  data: string;
  mimeType: string;
  expiresAt: number;
};

export function isStatusStorageId(id: string): boolean {
  return id.startsWith("st_");
}

export async function storeStatusMedia(
  bytes: ArrayBuffer,
  mimeType: string,
  ttlMs: number
): Promise<string> {
  if (bytes.byteLength > MAX_STATUS_BYTES) {
    throw new Error("Status file must be under 10 MB. Compress the image or video first.");
  }

  const id = `st_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const expiresAt = Date.now() + ttlMs;

  const record: StoredStatusFile = {
    data: Buffer.from(bytes).toString("base64"),
    mimeType: mimeType || "application/octet-stream",
    expiresAt,
  };

  await kv.set(`status:file:${id}`, record, { ex: Math.ceil(ttlMs / 1000) + 3600 });
  return id;
}

export async function getStatusMedia(
  id: string
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const record = (await kv.get(`status:file:${id}`)) as StoredStatusFile | null;
  if (!record?.data) return null;
  if (record.expiresAt <= Date.now()) {
    await kv.del(`status:file:${id}`);
    return null;
  }
  return {
    bytes: Buffer.from(record.data, "base64"),
    mimeType: record.mimeType,
  };
}

export async function isActiveStatusMedia(id: string): Promise<boolean> {
  const items: Array<{ mediaId: string; expiresAt: number }> =
    (await kv.get(STATUS_KEY)) || [];
  const now = Date.now();
  return items.some((item) => item.mediaId === id && item.expiresAt > now);
}
