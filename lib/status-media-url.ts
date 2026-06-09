import { isStatusStorageId } from "@/lib/status-storage";

/** Resolve the correct public URL for a status item's media. */
export function statusMediaUrl(apiBase: string, mediaId: string): string {
  const base = apiBase.replace(/\/$/, "");
  if (isStatusStorageId(mediaId)) {
    return `${base}/api/status/media/?id=${encodeURIComponent(mediaId)}`;
  }
  return `${base}/api/media/?id=${encodeURIComponent(mediaId)}`;
}
