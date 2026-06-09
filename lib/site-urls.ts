/** Vercel-hosted inbox + API (status & webhooks always live here). */
export function getInboxPublicBaseUrl(): string {
  const inboxOnly =
    process.env.NEXT_PUBLIC_INBOX_URL || process.env.INBOX_PUBLIC_URL;
  if (inboxOnly) {
    return inboxOnly.replace(/\/$/, "");
  }

  // Never use preview deployment URLs for customer share links
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`.replace(/\/$/, "")
    : "";
  if (vercelUrl.includes("pure-herbex-site.vercel.app")) {
    return vercelUrl;
  }

  return "https://pure-herbex-site.vercel.app";
}

export function getStatusPublicPageUrl(): string {
  return `${getInboxPublicBaseUrl()}/status/`;
}
