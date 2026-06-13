import type { InboxLine } from "@/lib/inbox-line";
import { kvPrefix } from "@/lib/inbox-line";

export function contactKey(line: InboxLine, phone: string): string {
  return `${kvPrefix(line)}contact:${phone}`;
}

export function marketingContactKey(line: InboxLine, phone: string): string {
  return `${kvPrefix(line)}marketing_contact:${phone}`;
}

export function activeContactsKey(line: InboxLine): string {
  return `${kvPrefix(line)}active_contacts`;
}

export function marketingContactsKey(line: InboxLine): string {
  return `${kvPrefix(line)}marketing_contacts`;
}

export function inboxVersionKey(line: InboxLine): string {
  return `${kvPrefix(line)}inbox_version`;
}

export function blockedKey(line: InboxLine): string {
  return `${kvPrefix(line)}blocked_numbers`;
}

export function campaignStatusKey(line: InboxLine): string {
  return `${kvPrefix(line)}campaign_status`;
}

export function migrationFlagKey(line: InboxLine): string {
  return `${kvPrefix(line)}migration_v1_complete`;
}
