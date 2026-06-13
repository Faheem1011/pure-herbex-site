/** Canonical public site URL (Hostinger production). */
export const SITE_URL = "https://pureherbex.com";

export const GA4_MEASUREMENT_ID = "G-SRYQF0G350";
export const GTM_CONTAINER_ID = "GTM-MV6QT5V3";
export const CLARITY_PROJECT_ID = "wsyc5zjml5";
export const GOOGLE_SITE_VERIFICATION = "r6EENSmrJ6_2NeYVkKtE2i-1pIu5qn6KxNegT-ws5OU";

/** Set in Hostinger/Vercel env after verifying at https://www.bing.com/webmasters */
export const BING_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ||
  process.env.BING_SITE_VERIFICATION ||
  "";

/** Optional Bing UET tag from Microsoft Advertising */
export const BING_UET_TAG_ID =
  process.env.NEXT_PUBLIC_BING_UET_TAG_ID || process.env.BING_UET_TAG_ID || "";

/** IndexNow key — file must exist at /{INDEXNOW_KEY}.txt */
export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "phxindexnow2026pureherbex";

export const INDEXNOW_KEY_URL = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`.replace(/([^:]\/)\/+/g, "$1");
}

export function buildVerificationMetadata(): Record<string, string> {
  const tags: Record<string, string> = {};
  if (BING_SITE_VERIFICATION) {
    tags["msvalidate.01"] = BING_SITE_VERIFICATION;
  }
  return tags;
}
