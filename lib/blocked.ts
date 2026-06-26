import { kv } from "@/lib/kv";
import type { InboxLine } from "@/lib/inbox-line";
import { blockedKey, contactKey } from "@/lib/kv-keys";

export function normalizePhone(phone: string | number): string {
  return String(phone ?? "").replace(/\D/g, "");
}

export async function isPhoneBlocked(
  phone: string,
  line: InboxLine = "main"
): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const inSet = await kv.sismember(blockedKey(line), normalized);
  if (inSet) return true;
  const contact: any = await kv.get(contactKey(line, normalized));
  return !!contact?.blocked;
}

export async function setPhoneBlocked(
  phone: string,
  blocked: boolean,
  line: InboxLine = "main"
): Promise<void> {
  const normalized = normalizePhone(phone);
  if (!normalized) return;
  if (blocked) {
    await kv.sadd(blockedKey(line), normalized);
  } else {
    await kv.srem(blockedKey(line), normalized);
  }
}
