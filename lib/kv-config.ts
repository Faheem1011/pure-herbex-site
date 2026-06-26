import { ensureKvEnv, normalizeKvRestUrl } from "@/lib/kv-env";

/** Hostname of the active KV database (for inbox diagnostics only). */
export function getKvHost(): string | null {
  ensureKvEnv();
  const url = normalizeKvRestUrl(process.env.KV_REST_API_URL);
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export const EXPECTED_KV_HOST = "cuddly-poodle-102740.upstash.io";
