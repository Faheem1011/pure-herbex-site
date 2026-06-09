/** Vercel-hosted inbox + API (status & webhooks always live here). */
export function getInboxPublicBaseUrl(): string {
  const inboxOnly =
    process.env.NEXT_PUBLIC_INBOX_URL || process.env.INBOX_PUBLIC_URL;
  if (inboxOnly) {
    return inboxOnly.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && /vercel\.app/i.test(siteUrl)) {
    return siteUrl.replace(/\/$/, "");
  }

  return "https://pure-herbex-site.vercel.app";
}

export function getStatusPublicPageUrl(): string {
  return `${getInboxPublicBaseUrl()}/status/`;
}
