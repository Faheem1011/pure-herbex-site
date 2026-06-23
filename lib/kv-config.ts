/** Hostname of the active KV database (for inbox diagnostics only). */
export function getKvHost(): string | null {
  const url = process.env.KV_REST_API_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export const EXPECTED_KV_HOST = "liked-mole-100771.upstash.io";
