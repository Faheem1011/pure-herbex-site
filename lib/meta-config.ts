/** Strip quotes/whitespace Vercel users often paste by mistake. */
export function sanitizeMetaToken(raw: string | undefined): string {
  if (!raw) return "";
  let t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t.replace(/\s+/g, "");
}

export function getMetaCapiAccessToken(): string | undefined {
  const token = sanitizeMetaToken(
    process.env.META_CAPI_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
  );
  return token || undefined;
}

export function hasMetaCapiToken(): boolean {
  return !!getMetaCapiAccessToken();
}
