/** Fix accidental Windows-path paste in Vercel env vars (e.g. C:\...\https:\host.upstash.io). */
export function normalizeKvRestUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let trimmed = raw.trim().replace(/^["']|["']$/g, "");
  trimmed = trimmed.replace(/https:\\/gi, "https://");
  const match = trimmed.match(/https:\/\/[^\s"'\\]+/i);
  if (match) return match[0].replace(/\/$/, "");
  return trimmed;
}

export function normalizeKvToken(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.trim().replace(/^["']|["']$/g, "");
}

let patched = false;

/** Patch process.env before @vercel/kv reads KV_REST_API_* */
export function ensureKvEnv(): void {
  if (patched) return;
  patched = true;

  const url = normalizeKvRestUrl(process.env.KV_REST_API_URL);
  if (url) process.env.KV_REST_API_URL = url;

  const token = normalizeKvToken(process.env.KV_REST_API_TOKEN);
  if (token) process.env.KV_REST_API_TOKEN = token;

  const readToken = normalizeKvToken(process.env.KV_REST_API_READ_ONLY_TOKEN);
  if (readToken) process.env.KV_REST_API_READ_ONLY_TOKEN = readToken;
}
