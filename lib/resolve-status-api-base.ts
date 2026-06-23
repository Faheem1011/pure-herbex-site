import { inboxPublicUrlFromEnv } from "@/lib/inbox-public-url";

const PRODUCTION_INBOX = inboxPublicUrlFromEnv();

/** Client-side API base for the public status page. */
export function resolveStatusClientApiBase(): string {
  if (typeof window === "undefined") {
    return PRODUCTION_INBOX.replace(/\/$/, "");
  }

  const { origin, hostname } = window.location;

  // Vercel production + preview + local dev — same-origin avoids CORS failures
  if (
    hostname.endsWith(".vercel.app") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return origin.replace(/\/$/, "");
  }

  return PRODUCTION_INBOX.replace(/\/$/, "");
}
