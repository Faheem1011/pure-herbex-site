import type { TagId } from "@/app/inbox/constants";

export const WINDOW_MS = 24 * 60 * 60 * 1000;
/** Send auto follow-up after this much time since last customer message. */
export const FOLLOWUP_AFTER_MS = 23 * 60 * 60 * 1000;

export const FOLLOWUP_EXCLUDED_TAGS = new Set<TagId>(["Confirm", "Spam"]);

export const WINDOW_FOLLOWUP_MESSAGE = `السلام علیکم! 🙂

آپ نے ہم سے رابطہ کیا تھا — کیا آپ ابھی بھی Pure Herbex آرڈر کرنا چاہتے ہیں؟

✅ 100% قدرتی اجزاء
✅ خفیہ پیکنگ
✅ کیش آن ڈیلیوری — پورے پاکستان

اگر دلچسپی ہے تو "ہاں" لکھ دیں، میں تفصیلات بھیج دیتا ہوں۔
شکریہ! 🙏`;

type WindowMessage = {
  sender?: string;
  timestamp?: number;
  isDeleted?: boolean;
};

export type WindowContact = {
  phone: string;
  name?: string;
  messages?: WindowMessage[];
  tag?: TagId | string | null;
  archived?: boolean;
  blocked?: boolean;
  followupSentForWindow?: number;
};

export function getLastIncomingTimestamp(contact: WindowContact): number | null {
  const messages = contact.messages || [];
  let latest: number | null = null;
  for (const msg of messages) {
    if (msg.sender !== "them" || msg.isDeleted) continue;
    const ts = Number(msg.timestamp);
    if (!ts || Number.isNaN(ts)) continue;
    if (latest === null || ts > latest) latest = ts;
  }
  return latest;
}

export function getWindowElapsedMs(
  contact: WindowContact,
  nowMs = Date.now()
): number | null {
  const lastIncoming = getLastIncomingTimestamp(contact);
  if (lastIncoming === null) return null;
  return nowMs - lastIncoming * 1000;
}

/** Customer message within the last 24 hours — free-text window still open. */
export function isInActiveWindow(contact: WindowContact, nowMs = Date.now()): boolean {
  const elapsed = getWindowElapsedMs(contact, nowMs);
  return elapsed !== null && elapsed >= 0 && elapsed < WINDOW_MS;
}

/** Window closed — only templates allowed. Never auto-message these. */
export function isExpiredWindow(contact: WindowContact, nowMs = Date.now()): boolean {
  const elapsed = getWindowElapsedMs(contact, nowMs);
  if (elapsed === null) return true;
  return elapsed >= WINDOW_MS;
}

export function isFollowupExcluded(contact: WindowContact): boolean {
  if (contact.blocked || contact.archived) return true;
  const tag = contact.tag;
  if (tag && FOLLOWUP_EXCLUDED_TAGS.has(tag as TagId)) return true;
  return false;
}

/**
 * Ready for the one-time 23h auto follow-up:
 * - Still inside 24h window (not expired, not older than 1 day)
 * - At least 23h since last customer message
 * - Not already sent for this window
 */
export function shouldSendWindowFollowup(
  contact: WindowContact,
  nowMs = Date.now()
): boolean {
  if (isFollowupExcluded(contact)) return false;

  const windowStart = getLastIncomingTimestamp(contact);
  if (windowStart === null) return false;

  const elapsed = nowMs - windowStart * 1000;
  if (elapsed < FOLLOWUP_AFTER_MS || elapsed >= WINDOW_MS) return false;

  if (contact.followupSentForWindow === windowStart) return false;

  return true;
}

export type WindowTimerTone = "green" | "yellow" | "orange" | "red" | "gray" | "none";

export function getWindowTimerDisplay(
  contact: WindowContact,
  nowMs = Date.now()
): { label: string; tone: WindowTimerTone; title: string } {
  const lastIncoming = getLastIncomingTimestamp(contact);
  if (lastIncoming === null) {
    return {
      label: "",
      tone: "none",
      title: "کوئی کسٹمر میسج نہیں — صرف ٹیمپلیٹ",
    };
  }

  const remainingMs = lastIncoming * 1000 + WINDOW_MS - nowMs;

  if (remainingMs <= 0) {
    return {
      label: "ختم",
      tone: "gray",
      title: "24 گھنٹے ختم — صرف ٹیمپلیٹ",
    };
  }

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  let tone: WindowTimerTone = "green";
  if (remainingMs < 60 * 60 * 1000) tone = "red";
  else if (remainingMs < 3 * 60 * 60 * 1000) tone = "orange";
  else if (remainingMs < 6 * 60 * 60 * 1000) tone = "yellow";

  const label =
    hours > 0 ? `${hours}گھ ${minutes}م` : `${minutes}م`;

  return {
    label,
    tone,
    title: `${hours} گھنٹے ${minutes} منٹ باقی — مفت جواب`,
  };
}

export const WINDOW_TIMER_TONE_CLASS: Record<WindowTimerTone, string> = {
  green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  red: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  gray: "text-zinc-500 border-zinc-700/50 bg-zinc-800/50",
  none: "",
};
