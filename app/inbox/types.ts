import type { TagId } from "@/app/inbox/constants";

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: number;
  status?: string;
  type?: string;
  mediaId?: string;
  fileName?: string;
  isVoiceNote?: boolean;
  /** Private agent label for voice/audio — never sent to WhatsApp */
  agentNote?: string;
  replyTo?: string;
  isDeleted?: boolean;
  /** false = unread for agent (incoming messages only) */
  readByAgent?: boolean;
  deliveryError?: string;
  deliveryErrorCode?: number;
  /** Meta/system messages (verification codes, unsupported API types) */
  systemKind?: "meta_verification" | "unsupported" | "reaction" | "system";
  unsupportedCode?: number;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface Contact {
  name: string;
  phone: string;
  messages: Message[];
  tag?: TagId | null;
  archived?: boolean;
  pinned?: boolean;
  blocked?: boolean;
  avatarUrl?: string;
  unreadCount?: number;
  hasUnread?: boolean;
  /** Last customer-message window start when auto follow-up was sent (once per window). */
  followupSentForWindow?: number;
}

export type StatusItem = {
  id: string;
  type: "image" | "video";
  mediaId: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
};

export type ViewMode = "inbox" | "promo" | "campaign" | "orders";
