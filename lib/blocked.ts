import { kv } from "@vercel/kv";

const BLOCKED_KEY = "whatsapp:blocked_numbers";

export function normalizePhone(phone: string | number): string {
  return String(phone ?? "").replace(/\D/g, "");
}

export async function isPhoneBlocked(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const inSet = await kv.sismember(BLOCKED_KEY, normalized);
  if (inSet) return true;
  const contact: any = await kv.get(`whatsapp:contact:${normalized}`);
  return !!contact?.blocked;
}

export async function setPhoneBlocked(phone: string, blocked: boolean): Promise<void> {
  const normalized = normalizePhone(phone);
  if (!normalized) return;
  if (blocked) {
    await kv.sadd(BLOCKED_KEY, normalized);
  } else {
    await kv.srem(BLOCKED_KEY, normalized);
  }
}
