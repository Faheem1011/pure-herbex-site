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
  replyTo?: string;
  isDeleted?: boolean;
  deliveryError?: string;
  deliveryErrorCode?: number;
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
  tag?: "Confirm" | "Potential" | "Important" | "Spam" | null;
  archived?: boolean;
  pinned?: boolean;
  blocked?: boolean;
  avatarUrl?: string;
  unreadCount?: number;
  hasUnread?: boolean;
}

export type StatusItem = {
  id: string;
  type: "image" | "video";
  mediaId: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
};

export type ViewMode = "inbox" | "promo" | "campaign" | "status";
