/** Production Vercel deployment (PureHerbex team). Update when the project URL changes. */
export const PRODUCTION_INBOX_URL = "https://pure-herbex-site-eight.vercel.app";

export function inboxPublicUrlFromEnv(): string {
  return (
    process.env.NEXT_PUBLIC_INBOX_URL ||
    process.env.INBOX_PUBLIC_URL ||
    PRODUCTION_INBOX_URL
  ).replace(/\/$/, "");
}
