const PRODUCTION_INBOX =
  process.env.NEXT_PUBLIC_INBOX_URL || "https://pure-herbex-site.vercel.app";

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
