import { kv } from "@/lib/kv";
import { isPhoneBlocked, normalizePhone, setPhoneBlocked } from "@/lib/blocked";
import type { InboxLine } from "@/lib/inbox-line";
import { contactKey, marketingContactKey } from "@/lib/kv-keys";
import { assessSpamProfile, type SpamAssessment } from "@/lib/spam-detect";
import { blockWhatsAppUser, unblockWhatsAppUser } from "@/lib/whatsapp-block";

const SPAM_STATS_KEY = "spam:stats";

export type SpamStats = {
  autoBlocked: number;
  manualBlocked: number;
  whatsappApiOk: number;
  whatsappApiFailed: number;
  lastBlockedAt?: number;
  lastBlockedName?: string;
};

async function bumpSpamStats(patch: {
  lastBlockedAt?: number;
  lastBlockedName?: string;
  increment?: Partial<
    Pick<SpamStats, "autoBlocked" | "manualBlocked" | "whatsappApiOk" | "whatsappApiFailed">
  >;
}): Promise<void> {
  const current = ((await kv.get(SPAM_STATS_KEY)) as SpamStats | null) || {
    autoBlocked: 0,
    manualBlocked: 0,
    whatsappApiOk: 0,
    whatsappApiFailed: 0,
  };
  const next: SpamStats = { ...current };
  if (patch.lastBlockedAt !== undefined) next.lastBlockedAt = patch.lastBlockedAt;
  if (patch.lastBlockedName !== undefined) next.lastBlockedName = patch.lastBlockedName;
  const inc = patch.increment;
  if (inc) {
    if (inc.autoBlocked) next.autoBlocked += inc.autoBlocked;
    if (inc.manualBlocked) next.manualBlocked += inc.manualBlocked;
    if (inc.whatsappApiOk) next.whatsappApiOk += inc.whatsappApiOk;
    if (inc.whatsappApiFailed) next.whatsappApiFailed += inc.whatsappApiFailed;
  }
  await kv.set(SPAM_STATS_KEY, next);
}

export async function getSpamStats(): Promise<SpamStats> {
  return (
    ((await kv.get(SPAM_STATS_KEY)) as SpamStats | null) || {
      autoBlocked: 0,
      manualBlocked: 0,
      whatsappApiOk: 0,
      whatsappApiFailed: 0,
    }
  );
}

export type BlockContactResult = {
  kvBlocked: boolean;
  whatsappBlocked: boolean;
  whatsappError?: string;
  whatsappCode?: number;
  alreadyBlocked: boolean;
};

/**
 * Full block: KV inbox filter + Meta WhatsApp block_users API.
 */
export async function blockContactCompletely(params: {
  phone: string;
  line?: InboxLine;
  name?: string;
  reason?: "manual" | "auto_spam";
  tagSpam?: boolean;
}): Promise<BlockContactResult> {
  const line = params.line ?? "main";
  const phone = normalizePhone(params.phone);
  if (!phone) {
    return {
      kvBlocked: false,
      whatsappBlocked: false,
      whatsappError: "Invalid phone",
      alreadyBlocked: false,
    };
  }

  const alreadyBlocked = await isPhoneBlocked(phone, line);
  await setPhoneBlocked(phone, true, line);

  const waResult = await blockWhatsAppUser(phone, line);

  const mainKey = contactKey(line, phone);
  const marketingKey = marketingContactKey(line, phone);
  let contact: Record<string, unknown> | null = await kv.get(mainKey);
  if (!contact) {
    contact = (await kv.get(marketingKey)) as Record<string, unknown> | null;
  }
  if (!contact && params.name) {
    contact = {
      name: params.name,
      phone,
      messages: [],
      blocked: true,
      blockedReason: params.reason,
      whatsappBlocked: waResult.ok,
      whatsappBlockError: waResult.error,
      autoSpamBlocked: params.reason === "auto_spam",
    };
    await kv.set(mainKey, contact);
  } else if (contact) {
    contact.blocked = true;
    contact.blockedReason = params.reason ?? contact.blockedReason;
    contact.whatsappBlocked = waResult.ok;
    if (!waResult.ok) contact.whatsappBlockError = waResult.error;
    else delete contact.whatsappBlockError;
    if (params.reason === "auto_spam") contact.autoSpamBlocked = true;
    if (params.tagSpam) contact.tag = "Spam";
    await kv.set(mainKey, contact);
  }

  await bumpSpamStats({
    lastBlockedAt: Date.now(),
    lastBlockedName: params.name,
    increment: {
      autoBlocked: params.reason === "auto_spam" ? 1 : 0,
      manualBlocked: params.reason === "manual" ? 1 : 0,
      whatsappApiOk: waResult.ok ? 1 : 0,
      whatsappApiFailed: waResult.ok ? 0 : 1,
    },
  });

  return {
    kvBlocked: true,
    whatsappBlocked: waResult.ok,
    whatsappError: waResult.error,
    whatsappCode: waResult.code,
    alreadyBlocked,
  };
}

export async function unblockContactCompletely(params: {
  phone: string;
  line?: InboxLine;
}): Promise<{ kvUnblocked: boolean; whatsappUnblocked: boolean; whatsappError?: string }> {
  const line = params.line ?? "main";
  const phone = normalizePhone(params.phone);
  if (!phone) {
    return { kvUnblocked: false, whatsappUnblocked: false, whatsappError: "Invalid phone" };
  }

  await setPhoneBlocked(phone, false, line);
  const waResult = await unblockWhatsAppUser(phone, line);

  const mainKey = contactKey(line, phone);
  const contact: Record<string, unknown> | null = await kv.get(mainKey);
  if (contact) {
    contact.blocked = false;
    delete contact.blockedReason;
    delete contact.autoSpamBlocked;
    contact.whatsappBlocked = false;
    delete contact.whatsappBlockError;
    await kv.set(mainKey, contact);
  }

  return {
    kvUnblocked: true,
    whatsappUnblocked: waResult.ok,
    whatsappError: waResult.error,
  };
}

/**
 * Run on incoming webhook before saving chat. Returns true if message was dropped (blocked).
 */
export async function handleIncomingSpamCheck(params: {
  phone: string;
  profileName: string;
  firstMessageText?: string;
  line: InboxLine;
  hasConfirmTag?: boolean;
}): Promise<{ blocked: boolean; assessment: SpamAssessment }> {
  const assessment = assessSpamProfile(params.profileName, {
    firstMessageText: params.firstMessageText,
    hasConfirmTag: params.hasConfirmTag,
  });

  if (assessment.verdict !== "spam") {
    return { blocked: false, assessment };
  }

  await blockContactCompletely({
    phone: params.phone,
    line: params.line,
    name: params.profileName,
    reason: "auto_spam",
    tagSpam: true,
  });

  return { blocked: true, assessment };
}
