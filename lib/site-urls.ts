import {
  PRODUCTION_INBOX_URL,
  inboxPublicUrlFromEnv,
} from "@/lib/inbox-public-url";

/** Vercel-hosted inbox + API (status & webhooks always live here). */
export function getInboxPublicBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_INBOX_URL || process.env.INBOX_PUBLIC_URL) {
    return inboxPublicUrlFromEnv();
  }

  // Prefer stable production hostname on Vercel (not per-deployment preview URLs).
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`.replace(/\/$/, "")
    : "";
  if (vercelUrl.includes("pure-herbex-site") && vercelUrl.endsWith(".vercel.app")) {
    return vercelUrl;
  }

  return PRODUCTION_INBOX_URL;
}

export function getStatusPublicPageUrl(): string {
  return `${getInboxPublicBaseUrl()}/status/`;
}
