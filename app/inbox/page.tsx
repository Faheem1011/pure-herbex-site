"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { startVoiceRecording, type VoiceRecordingSession } from "@/lib/voice-recorder";
import type { Contact, Message, StatusItem } from "@/app/inbox/types";
import { COMMON_EMOJIS, MARKETING_TEMPLATE, TAGS } from "@/app/inbox/constants";
import {
  formatChatTime,
  formatMessagePreview,
  getEpochTime,
  isMessageUnread,
  isMessageVoiceNote,
  parseLeadName,
} from "@/app/inbox/utils";
import MessageContent from "@/components/inbox/MessageContent";
import DeliveryTicks from "@/components/inbox/DeliveryTicks";
import { useAndroidBridge, getAndroidBridge } from "@/hooks/useAndroidBridge";
import { useSafeAreaInsets } from "@/hooks/useSafeAreaInsets";
import { exportMainInboxContacts } from "@/app/inbox/export-contacts";
import OrdersPanel from "@/app/inbox/OrdersPanel";
import { inboxLineLabel, withLineQuery, type InboxLine } from "@/lib/inbox-line";
import { isStatusStorageId } from "@/lib/status-storage";
import "./inbox.css";

function inboxStatusMediaSrc(mediaId: string): string {
  if (isStatusStorageId(mediaId)) {
    return `/api/status/media/?id=${encodeURIComponent(mediaId)}`;
  }
  return `/api/media/?id=${encodeURIComponent(mediaId)}`;
}

const STATUS_PAGE_URL = `${(process.env.NEXT_PUBLIC_INBOX_URL || "https://pure-herbex-site.vercel.app").replace(/\/$/, "")}/status/`;

export default function InboxPage() {
  const pathname = usePathname();
  const inboxLine: InboxLine = pathname?.startsWith("/inbox-us") ? "us" : "main";
  const api = (path: string) => withLineQuery(path, inboxLine);
  const inboxLineTitle = inboxLineLabel(inboxLine);
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      // Play a silent sound or short beep to unlock audio context
      const audio = new Audio("/assets/notification.mp3");
      audio.volume = 0.2;
      audio.play().catch(() => {});
      
      new Notification("Notifications Enabled", {
        body: "You will now receive alerts for new messages.",
        icon: "/logo.png"
      });
    }
  };
  const [loginError, setLoginError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const contactsRef = useRef<Contact[]>([]);
  const inboxVersionRef = useRef(0);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);
  const [isExportingContacts, setIsExportingContacts] = useState(false);

  useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"all" | "Confirm" | "Potential" | "Important" | "Spam" | "archived" | "blocked">("all");
  const [contactMenuTarget, setContactMenuTarget] = useState<Contact | null>(null);
  const [statusItems, setStatusItems] = useState<StatusItem[]>([]);
  const [statusCaption, setStatusCaption] = useState("");
  const [statusUploading, setStatusUploading] = useState(false);
  const statusFileRef = useRef<HTMLInputElement | null>(null);
  
  // Message features states
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Forwarding feature states
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [forwardMessages, setForwardMessages] = useState<Message[]>([]); // For bulk forwarding
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardSearchQuery, setForwardSearchQuery] = useState("");
  const [selectedForwardContacts, setSelectedForwardContacts] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);

  // Multi-select features states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const voiceSessionRef = useRef<VoiceRecordingSession | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Media & Location features
  const [directoryContacts, setDirectoryContacts] = useState<{ name: string; phone: string }[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<"directory" | "custom">("directory");
  const [dirSearchQuery, setDirSearchQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");

  // Marketing CRM states
  const [viewMode, setViewMode] = useState<"inbox" | "promo" | "campaign" | "status" | "orders">("inbox");
  const [crmFocusOrderId, setCrmFocusOrderId] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<{
    byPhone: Record<string, { orderId: string; needsAddress: boolean; needsTracking: boolean }>;
    counts: { active: number; needsAction: number };
  }>({ byPhone: {}, counts: { active: 0, needsAction: 0 } });
  const [campaignContacts, setCampaignContacts] = useState<Contact[]>([]);
  const campaignContactsRef = useRef<Contact[]>([]);
  const [activeCampaignChat, setActiveCampaignChat] = useState<Contact | null>(null);
  const activeCampaignChatRef = useRef<Contact | null>(null);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<Record<string, { status: string; sentAt?: number; messageId?: string; error?: string; name?: string }>>({});
  const [marketingSearch, setMarketingSearch] = useState("");
  const [marketingFilter, setMarketingFilter] = useState<"all" | "pending" | "sent" | "failed">("all");
  const [selectedMarketingLead, setSelectedMarketingLead] = useState<{ name: string; phone: string; city: string } | null>(null);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testName, setTestName] = useState("Test Customer");
  const [testCity, setTestCity] = useState("Karachi");

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const narrow = window.matchMedia("(max-width: 1023px)").matches;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      setIsMobile(narrow || coarse);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileType, setPendingFileType] = useState<"image" | "audio" | "video" | "document" | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ latitude: string; longitude: string; name: string; address: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Track activeChat in a Ref to prevent missing dependency warnings/re-runs in setInterval
  const activeChatRef = useRef<Contact | null>(null);
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat && (activeChat.hasUnread || (activeChat.unreadCount || 0) > 0)) {
      markChatRead(activeChat.phone);
    }
  }, [activeChat]);

  useEffect(() => {
    campaignContactsRef.current = campaignContacts;
  }, [campaignContacts]);

  useEffect(() => {
    activeCampaignChatRef.current = activeCampaignChat;
    if (activeCampaignChat && (activeCampaignChat.hasUnread || (activeCampaignChat.unreadCount || 0) > 0)) {
      markCampaignChatRead(activeCampaignChat.phone);
    }
  }, [activeCampaignChat]);

  const restoreSession = async (token: string) => {
    try {
      inboxVersionRef.current = 0;
      const res = await fetch(api("/api/inbox/sync/?since=0"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        inboxVersionRef.current = data.version || 0;
        localStorage.setItem("inbox_password", token);
        setSessionToken(token);
        setIsLoggedIn(true);
        if (!data.unchanged) {
          if (data.contacts) setContacts(data.contacts);
          if (data.campaignContacts) setCampaignContacts(data.campaignContacts);
        }
        return true;
      }
      localStorage.removeItem("inbox_password");
      if (res.status === 401) {
        setLoginError("Incorrect password. Please try again.");
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error ? `Server error: ${data.error}` : "Server error — try again in a moment.");
      }
      return false;
    } catch (e) {
      console.error("Failed to restore session", e);
      setLoginError("Could not reach server. Check your connection.");
      return false;
    }
  };

  // Restore login session from localStorage or Android native storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const android = (window as any).Android;
    const saved = localStorage.getItem("inbox_password") || (android?.getSession?.() ?? null);
    if (saved) restoreSession(saved);
  }, []);

  // Click outside listener to close custom message context menus
  useEffect(() => {
    const handleWindowClick = () => {
      setActiveMenuMessageId(null);
    };
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const startRecording = async () => {
    try {
      const android = (window as any).Android;
      if (android?.requestMicrophonePermission && !android.requestMicrophonePermission()) {
        alert("Microphone permission required. Allow it when prompted, then tap the mic again.");
        return;
      }

      voiceSessionRef.current = await startVoiceRecording();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      voiceSessionRef.current = null;
      const android = (window as any).Android;
      const settingsHint = android?.openAppSettings
        ? "\n\nIf blocked, open App Settings and enable Microphone."
        : "";
      alert("Could not access microphone. Please allow microphone access." + settingsHint);
      console.error(err);
    }
  };

  const stopAndSendRecording = async () => {
    const session = voiceSessionRef.current;
    if (!session || !isRecording) return;

    setIsRecording(false);
    voiceSessionRef.current = null;
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setSending(true);
    try {
      const file = await session.stopAndGetFile();
      const { mediaId } = await uploadFile(file, "auto", true);
      const res = await fetch(api("/api/messages/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          toPhone: activeChat?.phone,
          contactName: activeChat?.name,
          type: "audio",
          mediaId: mediaId,
          fileName: file.name,
          isVoiceNote: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        const newMsg: Message = {
          id: data.msgId,
          sender: "me",
          text: "🎤 Voice Note",
          timestamp: getEpochTime(),
          status: "sent",
          type: "voice",
          mediaId: mediaId,
          fileName: file.name,
          isVoiceNote: true,
        };

        if (activeChat) {
          const updatedChat = {
            ...activeChat,
            messages: [...activeChat.messages, newMsg],
          };
          setActiveChat(updatedChat);
          setContacts((prev) =>
            prev.map((c) => (c.phone === activeChat.phone ? updatedChat : c))
          );
        }
      } else {
        alert("Failed to send voice note: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error sending voice note: " + err.message);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const cancelRecording = () => {
    const session = voiceSessionRef.current;
    if (!session || !isRecording) return;

    setIsRecording(false);
    voiceSessionRef.current = null;
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    session.cancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Multi-select handlers
  const startSelectMode = (messageId?: string) => {
    setIsSelectMode(true);
    setActiveMenuMessageId(null);
    setSelectedMessageIds(messageId ? new Set([messageId]) : new Set());
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedMessageIds.size === 0 || !activeChat) return;
    if (!confirm(`Delete ${selectedMessageIds.size} messages?`)) return;

    const idsToDelete = Array.from(selectedMessageIds);
    
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => {
        if (c.phone === activeChat.phone) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              selectedMessageIds.has(m.id) ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
            ),
          };
        }
        return c;
      })
    );

    if (activeChat.phone) {
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            selectedMessageIds.has(m.id) ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
          ),
        };
      });
    }

    try {
      for (const msgId of idsToDelete) {
        await fetch(api("/api/messages/"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({ phone: activeChat.phone, deleteMessageId: msgId }),
        });
      }
    } catch (e) {
      console.error("Bulk delete error:", e);
    } finally {
      setIsSelectMode(false);
      setSelectedMessageIds(new Set());
    }
  };

  const handleBulkForward = () => {
    if (selectedMessageIds.size === 0 || !activeChat) return;
    
    const selectedMsgs = activeChat.messages
      .filter(m => selectedMessageIds.has(m.id) && !m.isDeleted)
      .sort((a, b) => a.timestamp - b.timestamp);
      
    setForwardMessages(selectedMsgs);
    setForwardMessage(null);
    setSelectedForwardContacts([]);
    setIsForwardModalOpen(true);
    setIsSelectMode(false);
    setSelectedMessageIds(new Set());
  };

  const selectAllMessages = () => {
    if (!activeChat) return;
    setSelectedMessageIds(
      new Set(activeChat.messages.filter((m) => !m.isDeleted).map((m) => m.id))
    );
  };

  const handleForward = async () => {
    const messagesToForward = forwardMessage ? [forwardMessage] : forwardMessages;
    if (messagesToForward.length === 0 || selectedForwardContacts.length === 0) return;
    
    setIsForwarding(true);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const msg of messagesToForward) {
        let mediaId = msg.mediaId;
        let fileName = msg.fileName;
        let isVoiceNote = isMessageVoiceNote(msg);
        const msgType = msg.type === "voice" ? "audio" : msg.type || "text";

        if (
          msg.mediaId &&
          msgType !== "text" &&
          msgType !== "location"
        ) {
          const fresh = await refreshMediaForForward(msg);
          mediaId = fresh.mediaId;
          fileName = fresh.fileName;
          isVoiceNote = fresh.isVoiceNote;
        }

        for (const phone of selectedForwardContacts) {
          const targetContact = contacts.find(c => c.phone === phone);
          const res = await fetch(api("/api/messages/"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              toPhone: phone,
              replyText: msgType === "text" ? msg.text : undefined,
              contactName: targetContact?.name || "WhatsApp Contact",
              type: msgType,
              mediaId: mediaId || undefined,
              fileName: fileName || undefined,
              location: msg.location || undefined,
              isVoiceNote: isVoiceNote || undefined,
              agentNote: msg.agentNote,
            }),
          });

          if (res.ok) {
            successCount++;
            const data = await res.json();
            setContacts((prev) => {
              return prev.map((c) => {
                if (c.phone === phone) {
                  const newMsg: Message = {
                    id: data.msgId,
                    sender: "me",
                    text: msg.text,
                    timestamp: getEpochTime(),
                    status: "sent",
                    type: isVoiceNote ? "voice" : msg.type || "text",
                    mediaId: mediaId || undefined,
                    fileName: fileName || undefined,
                    location: msg.location || undefined,
                    isVoiceNote: isVoiceNote || undefined,
                    agentNote: msg.agentNote,
                  };
                  return { ...c, messages: [...c.messages, newMsg] };
                }
                return c;
              });
            });
          } else {
            failCount++;
          }
        }
      }
      setIsForwardModalOpen(false);
      setForwardMessage(null);
      setForwardMessages([]);
      setSelectedForwardContacts([]);
      if (failCount === 0) {
        alert(`Forwarded ${successCount} message${successCount === 1 ? "" : "s"} successfully.`);
      } else {
        alert(`Forwarded ${successCount}, failed ${failCount}. Check connection and try again.`);
      }
    } catch (err: any) {
      alert("Error forwarding message: " + err.message);
    } finally {
      setIsForwarding(false);
    }
  };

  const applyReadFlags = (contact: Contact, read: boolean): Contact => {
    const messages = contact.messages.map((m) =>
      m.sender === "them" && !m.isDeleted ? { ...m, readByAgent: read } : m
    );
    const unreadCount = read
      ? 0
      : messages.filter((m) => m.sender === "them" && !m.isDeleted && m.readByAgent === false).length;
    return { ...contact, messages, unreadCount, hasUnread: unreadCount > 0 };
  };

  const applyMessageRead = (contact: Contact, messageId: string, read: boolean): Contact => {
    const messages = contact.messages.map((m) =>
      m.id === messageId && m.sender === "them" && !m.isDeleted ? { ...m, readByAgent: read } : m
    );
    const unreadCount = messages.filter(
      (m) => m.sender === "them" && !m.isDeleted && m.readByAgent === false
    ).length;
    return { ...contact, messages, unreadCount, hasUnread: unreadCount > 0 };
  };

  const contactHasIncoming = (c: Contact) =>
    c.messages.some((m) => m.sender === "them" && !m.isDeleted);

  const markChatRead = async (phone: string) => {
    setContacts((prev) => prev.map((c) => (c.phone === phone ? applyReadFlags(c, true) : c)));
    if (activeChat?.phone === phone) {
      setActiveChat((prev) => (prev ? applyReadFlags(prev, true) : null));
    }
    try {
      await fetch(api("/api/messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, markRead: true }),
      });
    } catch (e) {}
  };

  const markChatUnread = async (phone: string) => {
    setContacts((prev) => prev.map((c) => (c.phone === phone ? applyReadFlags(c, false) : c)));
    if (activeChat?.phone === phone) {
      setActiveChat((prev) => (prev ? applyReadFlags(prev, false) : null));
    }
    try {
      await fetch(api("/api/messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, markUnread: true }),
      });
    } catch (e) {}
  };

  const markMessageReadState = async (
    phone: string,
    messageId: string,
    read: boolean,
    scope: "main" | "campaign" = "main"
  ) => {
    const patch = (c: Contact) => applyMessageRead(c, messageId, read);
    if (scope === "main") {
      setContacts((prev) => prev.map((c) => (c.phone === phone ? patch(c) : c)));
      if (activeChat?.phone === phone) {
        setActiveChat((prev) => (prev ? patch(prev) : null));
      }
      try {
        await fetch(api("/api/messages/"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({ phone, messageId, messageRead: read }),
        });
      } catch (e) {}
    } else {
      setCampaignContacts((prev) => prev.map((c) => (c.phone === phone ? patch(c) : c)));
      if (activeCampaignChat?.phone === phone) {
        setActiveCampaignChat((prev) => (prev ? patch(prev) : null));
      }
      try {
        await fetch(api("/api/marketing-messages/"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({ phone, messageId, messageRead: read }),
        });
      } catch (e) {}
    }
    setActiveMenuMessageId(null);
  };

  const handleMessageLongPress = (id: string) => {
    longPressTriggeredRef.current = true;
    if (isSelectMode) {
      toggleMessageSelection(id);
    } else {
      startSelectMode(id);
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = () => {
    try {
      if (!notificationSoundRef.current) {
        notificationSoundRef.current = new Audio("/assets/notification.mp3");
      }
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch((e) => console.error("Error playing sound:", e));
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  };

  const showBrowserNotification = (name: string, text: string, scope: "main" | "campaign" = "main") => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        const prefix = scope === "campaign" ? "Campaign reply" : "New message";
        const n = new Notification(`${prefix} from ${name}`, {
          body: text,
          icon: "/logo.png",
          tag: `${scope}-msg-${name}`,
          renotify: true
        } as NotificationOptions);

        // Mobile vibration support
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (err) {
        console.error("Notification display failed", err);
      }
    }
  };

  // Load directory contacts
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/contacts.json")
      .then((res) => res.json())
      .then((data) => {
        setDirectoryContacts(data);
      })
      .catch((err) => console.error("Failed to load contacts directory", err));
  }, [isLoggedIn]);

  const fetchCampaignStatus = async () => {
    try {
      const res = await fetch(api("/api/campaign/"), {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.status) setCampaignStatus(data.status);
    } catch (err) {
      console.error("Failed to load campaign status", err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || viewMode !== "promo") return;
    fetchCampaignStatus();
  }, [isLoggedIn, viewMode]);

  useEffect(() => {
    if (!isLoggedIn || viewMode !== "status") return;
    fetchStatusItems();
  }, [isLoggedIn, viewMode]);

  const sendBatchMarketing = async (limit = 20) => {
    if (!window.confirm(`Send ${MARKETING_TEMPLATE} to the next ${limit} pending leads?`)) return;
    setIsSendingCampaign(true);
    try {
      const res = await fetch(api("/api/campaign/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ batch: true, limit, templateName: MARKETING_TEMPLATE, languageCode: "en", bodyVarCount: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch send failed");
      await fetchCampaignStatus();
      await fetchCampaignChats(true);
      alert(`Batch done!\nSent: ${data.sent}\nFailed: ${data.failed}\nSkipped (blocked): ${data.skipped}${data.firstError ? `\nError: ${data.firstError}` : ""}${data.remaining ? `\n${data.remaining} still pending — run again.` : ""}`);
    } catch (e: any) {
      alert("Batch failed: " + e.message);
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const sendTemplateToLead = async (
    phone: string,
    name: string,
    city: string,
    confirm = true
  ) => {
    if (confirm && !window.confirm(`Send "${MARKETING_TEMPLATE}" to ${name} (+${phone})?`)) {
      return false;
    }

    setIsSendingCampaign(true);
    try {
      const res = await fetch(api("/api/campaign/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          toPhone: phone,
          contactName: name,
          city,
          templateName: MARKETING_TEMPLATE,
          languageCode: "en",
          bodyVarCount: 0,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setCampaignStatus((prev) => ({
          ...prev,
          [phone]: {
            status: "sent",
            sentAt: Date.now(),
            messageId: data.msgId,
            name,
          },
        }));
        fetchCampaignChats(true);
        return true;
      }

      setCampaignStatus((prev) => ({
        ...prev,
        [phone]: {
          status: "failed",
          sentAt: Date.now(),
          error: data.error,
          name,
        },
      }));
      alert("Failed to send template: " + (data.error || "Unknown error"));
      return false;
    } catch (err: any) {
      alert("Error: " + err.message);
      return false;
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const resetLeadCampaignStatus = async (phone: string) => {
    try {
      await fetch(api("/api/campaign/"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone }),
      });
      setCampaignStatus((prev) => {
        const next = { ...prev };
        delete next[phone];
        return next;
      });
    } catch (err) {
      console.error("Failed to reset campaign status", err);
    }
  };

  const marketingLeads = directoryContacts.map((dc) => {
    const parsed = parseLeadName(dc.name);
    return { ...dc, ...parsed, displayName: dc.name };
  });

  const getLeadStatus = (phone: string) => campaignStatus[phone]?.status || "pending";

  const filteredMarketingLeads = marketingLeads.filter((lead) => {
    const status = getLeadStatus(lead.phone);
    if (marketingFilter !== "all" && status !== marketingFilter) return false;
    if (!marketingSearch) return true;
    const q = marketingSearch.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.city.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.displayName.toLowerCase().includes(q)
    );
  });

  const marketingStats = {
    pending: marketingLeads.filter((l) => getLeadStatus(l.phone) === "pending").length,
    sent: marketingLeads.filter((l) => getLeadStatus(l.phone) === "sent").length,
    failed: marketingLeads.filter((l) => getLeadStatus(l.phone) === "failed").length,
  };

  const fetchInboxSync = async (silent = false, forceFull = false): Promise<boolean> => {
    if (!sessionToken) return false;
    if (!silent) setIsRefreshing(true);
    try {
      const since = forceFull ? 0 : inboxVersionRef.current;
      const res = await fetch(api(`/api/inbox/sync/?since=${since}`), {
        headers: { Authorization: `Bearer ${sessionToken}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        setIsLoggedIn(false);
        setSessionToken(null);
        return false;
      }
      if (!res.ok) return false;
      const data = await res.json();
      inboxVersionRef.current = data.version ?? inboxVersionRef.current;
      if (data.unchanged && !forceFull) return true;

      if (data.contacts) {
        // Handle notifications for new messages
        const prevContacts = contactsRef.current;
        data.contacts.forEach((newContact: Contact) => {
          const oldContact = prevContacts.find(c => c.phone === newContact.phone);
          
          // Only notify if we already had this contact in memory (prevents notification on first load)
          if (oldContact) {
            const newMessages = newContact.messages || [];
            const oldMessages = oldContact.messages || [];
            
            // Detect new incoming messages
            if (newMessages.length > oldMessages.length) {
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.sender === "them") {
                playNotificationSound();
                showBrowserNotification(newContact.name, lastMsg.text);
              }
            }
          }
        });

        // Sort contacts by latest message timestamp
        const sorted = data.contacts.sort((a: Contact, b: Contact) => {
          const timeA = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1].timestamp : 0;
          const timeB = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1].timestamp : 0;
          return timeB - timeA;
        });

        // Preserve any newly started empty chats that haven't received a message yet
        setContacts((prev) => {
          const emptyChats = prev.filter(
            (p) => (!p.messages || p.messages.length === 0) && !sorted.some((s: Contact) => s.phone === p.phone)
          );

          // Re-apply tags & use server-side unread states
          const merged = [...emptyChats, ...sorted].map((c: Contact) => {
            const localContact = prev.find((p) => p.phone === c.phone);
            
            // Preserve tag from local state if server doesn't have it (fallback)
            if (localContact?.tag && !c.tag) {
              c.tag = localContact.tag;
            }

            // If the chat is currently open, mark it as read immediately
            const isOpen = activeChatRef.current?.phone === c.phone;
            if (isOpen && (c.hasUnread || (c.unreadCount || 0) > 0)) {
              markChatRead(c.phone);
              return applyReadFlags(c, true);
            }

            // Otherwise, trust the server-side unread state
            return c;
          });
          return merged;
        });

        // Update active chat history if open
        const currentActive = activeChatRef.current;
        if (currentActive) {
          const updatedActive = sorted.find((c: Contact) => c.phone === currentActive.phone);
          if (updatedActive) {
            setActiveChat(applyReadFlags(updatedActive, true));
          }
        }
      }

      if (data.campaignContacts) {
        const prevCampaign = campaignContactsRef.current;
        data.campaignContacts.forEach((newContact: Contact) => {
          const oldContact = prevCampaign.find((c) => c.phone === newContact.phone);
          if (oldContact) {
            const newMessages = newContact.messages || [];
            const oldMessages = oldContact.messages || [];
            if (newMessages.length > oldMessages.length) {
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.sender === "them") {
                playNotificationSound();
                showBrowserNotification(newContact.name, lastMsg.text, "campaign");
              }
            }
          }
        });

        const sortedCampaign = data.campaignContacts.sort((a: Contact, b: Contact) => {
          const timeA = a.messages?.[a.messages.length - 1]?.timestamp || 0;
          const timeB = b.messages?.[a.messages.length - 1]?.timestamp || 0;
          return timeB - timeA;
        });

        setCampaignContacts(sortedCampaign);

        const currentCampaign = activeCampaignChatRef.current;
        if (currentCampaign) {
          const updated = sortedCampaign.find((c: Contact) => c.phone === currentCampaign.phone);
          if (updated) {
            const isCampaignOpen = activeCampaignChatRef.current?.phone === updated.phone;
            setActiveCampaignChat(
              isCampaignOpen ? applyReadFlags(updated, true) : updated
            );
          }
        }
      }
      return true;
    } catch (err) {
      console.error("Failed to sync inbox", err);
      return false;
    } finally {
      if (!silent) {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  const fetchChats = (silent = false) => fetchInboxSync(silent);

  const handleRefresh = async () => {
    if (!sessionToken) return;
    const ok = await fetchInboxSync(false, true);
    try {
      if (viewMode === "status") await fetchStatusItems();
      if (viewMode === "promo") await fetchCampaignStatus();
    } catch (e) {
      console.error("Refresh extras failed", e);
    }
    setRefreshNote(ok ? "Updated" : "Refresh failed — check connection");
    window.setTimeout(() => setRefreshNote(null), 2200);
    getAndroidBridge()?.onRefreshComplete?.();
  };

  const handleExportContacts = async (format: "csv" | "json" = "csv") => {
    if (!sessionToken) return;
    setIsExportingContacts(true);
    try {
      const { count, filename } = await exportMainInboxContacts(sessionToken, format);
      const exported = count > 0 ? count : contacts.length;
      alert(`Exported ${exported} contact${exported === 1 ? "" : "s"} to ${filename}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Export failed";
      alert(message);
    } finally {
      setIsExportingContacts(false);
    }
  };
  const fetchCampaignChats = (silent = false) => fetchInboxSync(silent);

  const markCampaignChatRead = async (phone: string) => {
    setCampaignContacts((prev) =>
      prev.map((c) => (c.phone === phone ? applyReadFlags(c, true) : c))
    );
    if (activeCampaignChat?.phone === phone) {
      setActiveCampaignChat((prev) => (prev ? applyReadFlags(prev, true) : null));
    }
    try {
      await fetch(api("/api/marketing-messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, markRead: true }),
      });
    } catch (e) {}
  };

  const markCampaignChatUnread = async (phone: string) => {
    setCampaignContacts((prev) =>
      prev.map((c) => (c.phone === phone ? applyReadFlags(c, false) : c))
    );
    if (activeCampaignChat?.phone === phone) {
      setActiveCampaignChat((prev) => (prev ? applyReadFlags(prev, false) : null));
    }
    try {
      await fetch(api("/api/marketing-messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, markUnread: true }),
      });
    } catch (e) {}
  };

  useAndroidBridge({
    isLoggedIn,
    viewMode,
    setViewMode,
    activeChatOpen: activeChat !== null,
    activeCampaignChatOpen: activeCampaignChat !== null,
    isSelectMode,
    setIsSelectMode,
    setSelectedMessageIds,
    isForwardModalOpen,
    setIsForwardModalOpen,
    isNewChatOpen,
    setIsNewChatOpen,
    isLocationModalOpen,
    setIsLocationModalOpen,
    contactMenuOpen: contactMenuTarget !== null,
    setContactMenuOpen: (open) => {
      if (!open) setContactMenuTarget(null);
    },
    showAttachMenu,
    setShowAttachMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    onCloseActiveChat: () => setActiveChat(null),
    onCloseCampaignChat: () => setActiveCampaignChat(null),
    selectedMarketingLeadOpen: selectedMarketingLead !== null,
    onCloseMarketingLead: () => setSelectedMarketingLead(null),
    onRefresh: handleRefresh,
  });

  const startCampaignChat = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const existing = campaignContacts.find((c) => c.phone === cleanPhone);
    if (existing) {
      setActiveCampaignChat(existing);
    } else {
      const newContact: Contact = { name: name || "Lead", phone: cleanPhone, messages: [] };
      setCampaignContacts((prev) => [newContact, ...prev]);
      setActiveCampaignChat(newContact);
    }
    setViewMode("campaign");
    setSelectedMarketingLead(null);
  };

  const promoteToMainInbox = async (phone: string) => {
    try {
      await fetch(api("/api/marketing-messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, promoteToMain: true }),
      });
      setCampaignContacts((prev) => prev.filter((c) => c.phone !== phone));
      setActiveCampaignChat(null);
      await fetchChats(true);
      alert("Moved to main inbox. Future replies will appear there.");
    } catch (e: any) {
      alert("Failed to move contact: " + e.message);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    let interval: ReturnType<typeof setInterval>;
    const poll = () => fetchInboxSync(true);
    const resetInterval = () => {
      clearInterval(interval);
      const ms = typeof document !== "undefined" && document.hidden ? 45000 : 15000;
      interval = setInterval(poll, ms);
    };

    poll();
    resetInterval();
    document.addEventListener("visibilitychange", resetInterval);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", resetInterval);
    };
  }, [isLoggedIn, sessionToken]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, activeCampaignChat?.messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await restoreSession(password);
    if (ok) {
      try {
        (window as any).Android?.saveSession?.(password);
      } catch (err) {}
      setLoginError("");
    }
  };

  type UploadResult = { mediaId: string; category?: string; filename?: string };

  const refreshMediaForForward = async (
    msg: Message
  ): Promise<{ mediaId: string; fileName?: string; isVoiceNote: boolean }> => {
    if (!msg.mediaId) {
      throw new Error("Missing media for forward");
    }

    const isVoice = isMessageVoiceNote(msg);
    const res = await fetch(`/api/media/?id=${encodeURIComponent(msg.mediaId)}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!res.ok) {
      throw new Error("Could not prepare media for forwarding");
    }

    const blob = await res.blob();
    const fileName =
      msg.fileName ||
      (isVoice ? `voice-note-${Date.now()}.ogg` : `forward-${Date.now()}`);
    const msgType = msg.type === "voice" ? "audio" : msg.type || "document";
    const mime =
      blob.type && blob.type !== "application/octet-stream"
        ? blob.type
        : isVoice
          ? "audio/ogg; codecs=opus"
          : msgType === "image"
            ? "image/jpeg"
            : msgType === "video"
              ? "video/mp4"
              : "application/octet-stream";

    const file = new File([blob], fileName, { type: mime });
    const upload = await uploadFile(
      file,
      msgType === "video" ? "video" : "auto",
      isVoice
    );

    return {
      mediaId: upload.mediaId,
      fileName: upload.filename || fileName,
      isVoiceNote: isVoice,
    };
  };

  const uploadFile = async (
    file: File,
    sendAs: "auto" | "document" | "video" = "auto",
    voiceNote = false
  ): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sendAs", sendAs);
    if (voiceNote) formData.append("voiceNote", "true");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch("/api/media/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (text.includes("Payload Too Large") || res.status === 413) {
          throw new Error("Video is too large for upload. Compress to under 4 MB (use a free compressor app) and try again.");
        }
        throw new Error(text || "Failed to upload file");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file to WhatsApp Media server");
      }
      return {
        mediaId: data.mediaId,
        category: data.category,
        filename: data.filename,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error("Upload timed out. Try a smaller or compressed video.");
      }
      throw err;
    }
  };

  const handleCampaignSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaignChat || sending || !replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch(api("/api/marketing-messages/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          toPhone: activeCampaignChat.phone,
          replyText: replyText,
          contactName: activeCampaignChat.name,
          type: "text",
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        const newMsg: Message = {
          id: data.msgId,
          sender: "me",
          text: replyText,
          timestamp: getEpochTime(),
          status: "sent",
          type: "text",
        };
        const updated = { ...activeCampaignChat, messages: [...activeCampaignChat.messages, newMsg] };
        setActiveCampaignChat(updated);
        setCampaignContacts((prev) => prev.map((c) => (c.phone === activeCampaignChat.phone ? updated : c)));
        setReplyText("");
      } else {
        alert("Failed to send: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || sending || activeChat.blocked) return;

    const hasAttachment = pendingFile || pendingLocation;
    if (!replyText.trim() && !hasAttachment) return;

    setSending(true);
    try {
      let mediaId = "";
      let msgType = "text";
      let fileToUpload = pendingFile;
      let uploadFilename = pendingFile?.name;

      if (pendingFile) {
        if (pendingFileType === "image" && pendingFile.size > 4 * 1024 * 1024) {
          fileToUpload = await compressImage(pendingFile);
        }

        if (fileToUpload) {
          const upload = await uploadFile(
            fileToUpload,
            pendingFileType === "video" ? "auto" : "auto"
          );
          mediaId = upload.mediaId;
          uploadFilename = upload.filename || fileToUpload.name;
          if (pendingFileType === "video") {
            // Deliver as document — works with most MP4 codecs WhatsApp video mode rejects
            msgType = upload.category === "video" ? "video" : "document";
          } else {
            msgType = upload.category === "image" ? "image"
              : upload.category === "audio" ? "audio"
              : upload.category === "video" ? "video"
              : pendingFileType || "document";
          }
        }
      } else if (pendingLocation) {
        msgType = "location";
      }

      // 2. Dispatch message
      const res = await fetch(api("/api/messages/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          toPhone: activeChat.phone,
          replyText: msgType === "text" ? replyText : undefined,
          contactName: activeChat.name,
          type: msgType,
          mediaId: mediaId || undefined,
          replyTo: replyingTo?.id || undefined,
          fileName: uploadFilename || undefined,
          location: pendingLocation ? {
            latitude: parseFloat(pendingLocation.latitude),
            longitude: parseFloat(pendingLocation.longitude),
            name: pendingLocation.name,
            address: pendingLocation.address,
          } : undefined,
          isVoiceNote:
            msgType === "audio" &&
            (!!uploadFilename?.toLowerCase().startsWith("voice-note-") ||
              pendingFileType === "audio"),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        let displayLogText = replyText || "";
        const isVideoDoc = msgType === "document" && /\.(mp4|mov|m4v|3gp)$/i.test(uploadFilename || "");
        if (msgType === "image") displayLogText = "📷 Photo";
        else if (msgType === "audio") displayLogText = "🎵 Audio/Voice Note";
        else if (msgType === "video" || isVideoDoc) displayLogText = "🎥 Video";
        else if (msgType === "document") displayLogText = uploadFilename ? `📄 File: ${uploadFilename}` : "📄 File";
        else if (msgType === "location") displayLogText = pendingLocation?.name ? `📍 Location: ${pendingLocation.name}` : "📍 Location";

        const newMsg: Message = {
          id: data.msgId,
          sender: "me",
          text: displayLogText,
          timestamp: getEpochTime(),
          status: "sent",
          type: isVideoDoc ? "video" : msgType,
          mediaId: mediaId || undefined,
          replyTo: replyingTo?.id || undefined,
          fileName: uploadFilename || undefined,
          location: pendingLocation ? {
            latitude: parseFloat(pendingLocation.latitude),
            longitude: parseFloat(pendingLocation.longitude),
            name: pendingLocation.name,
            address: pendingLocation.address,
          } : undefined,
        };

        const updatedChat = {
          ...activeChat,
          messages: [...activeChat.messages, newMsg],
        };
        setActiveChat(updatedChat);
        
        // Update main contacts list
        setContacts((prev) =>
          prev.map((c) => (c.phone === activeChat.phone ? updatedChat : c))
        );

        // Reset inputs
        setReplyText("");
        setPendingFile(null);
        setPendingFileType(null);
        setPendingLocation(null);
        setReplyingTo(null);
      } else {
        alert("Failed to send message: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error sending message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Tag updating function
  const saveMessageAgentNote = async (phone: string, messageId: string, note: string) => {
    const trimmed = note.trim().slice(0, 200);
    const patchMsg = (c: Contact): Contact => ({
      ...c,
      messages: c.messages.map((m) => {
        if (m.id !== messageId) return m;
        if (!trimmed) {
          const { agentNote: _removed, ...rest } = m;
          return rest as Message;
        }
        return { ...m, agentNote: trimmed };
      }),
    });

    setContacts((prev) => prev.map((c) => (c.phone === phone ? patchMsg(c) : c)));
    if (activeChat?.phone === phone) {
      setActiveChat((prev) => (prev ? patchMsg(prev) : null));
    }

    try {
      await fetch(api("/api/messages/"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone, messageId, agentNote: trimmed }),
      });
    } catch (e) {
      console.error("Failed to save voice label", e);
    }
  };

  const fetchOrderSummary = async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch("/api/orders/summary/", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.byPhone) {
        setOrderSummary({
          byPhone: data.byPhone,
          counts: {
            active: data.counts?.active ?? 0,
            needsAction: data.counts?.needsAction ?? 0,
          },
        });
      }
    } catch (e) {
      console.error("Failed to load order summary", e);
    }
  };

  const openCrmForPhone = async (phone: string, customerName: string) => {
    const meta = orderSummary.byPhone[phone];
    if (meta?.orderId) {
      setViewMode("orders");
      setActiveChat(null);
      setCrmFocusOrderId(meta.orderId);
      return;
    }
    await addToOrdersCrm(phone, customerName, true);
    void fetchOrderSummary();
  };

  const addToOrdersCrm = async (phone: string, customerName: string, openAfter = false) => {
    if (!sessionToken) return;
    try {
      const res = await fetch("/api/orders/from-inbox/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone, customerName }),
      });
      const data = await res.json();
      if (data.order) {
        void fetchOrderSummary();
        if (openAfter) {
          setViewMode("orders");
          setActiveChat(null);
          setCrmFocusOrderId(data.order.id);
        } else {
          alert(
            data.status === "exists"
              ? "This customer already has an active order in CRM."
              : "Order created in CRM. Open Orders tab to add delivery details."
          );
        }
        return data.order;
      }
      throw new Error(data.error || "Failed to create order");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not add to CRM");
      return null;
    }
  };

  useEffect(() => {
    if (isLoggedIn && sessionToken) void fetchOrderSummary();
  }, [isLoggedIn, sessionToken]);

  const openChatFromCrm = (phone: string, name: string) => {
    const contact = contacts.find((c) => c.phone === phone);
    setViewMode("inbox");
    setActiveTab("all");
    setActiveChat(
      contact || {
        name,
        phone,
        messages: [],
      }
    );
    setCrmFocusOrderId(null);
  };

  const updateContactTag = async (phone: string, tag: "Confirm" | "Potential" | "Important" | "Spam" | null) => {
    const contact = contacts.find((c) => c.phone === phone) || activeChat;
    try {
      // Optimistic update in state
      setContacts((prev) =>
        prev.map((c) => {
          if (c.phone === phone) {
            const updated = { ...c, tag };
            if (activeChat?.phone === phone) {
              setActiveChat(updated);
            }
            return updated;
          }
          return c;
        })
      );

      const res = await fetch("/api/tags/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone, tag }),
      });
      if (!res.ok) {
        throw new Error("Failed to sync tag with database");
      }

      if (tag === "Confirm" && contact && !orderSummary.byPhone[phone]) {
        if (confirm(`Add ${contact.name} to Orders CRM?`)) {
          await addToOrdersCrm(phone, contact.name, true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateContactFlag = async (
    phone: string,
    patch: { pinned?: boolean; blocked?: boolean; archived?: boolean; markRead?: boolean }
  ) => {
    setContacts((prev) =>
      prev.map((c) => (c.phone === phone ? { ...c, ...patch, ...(patch.markRead ? { hasUnread: false, unreadCount: 0 } : {}) } : c))
    );
    if (activeChat?.phone === phone) {
      setActiveChat((prev) => (prev ? { ...prev, ...patch, ...(patch.markRead ? { hasUnread: false, unreadCount: 0 } : {}) } : null));
    }
    try {
      await fetch(api("/api/messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, ...patch }),
      });
    } catch (e) {
      console.error("Failed to update contact", e);
    }
  };

  const pinContact = (phone: string, pinned: boolean) => updateContactFlag(phone, { pinned });
  const blockContact = (phone: string, blocked: boolean) => {
    updateContactFlag(phone, { blocked });
    if (blocked && activeChat?.phone === phone) setActiveChat(null);
  };

  const fetchStatusItems = async () => {
    try {
      const res = await fetch("/api/status/", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.items) setStatusItems(data.items);
    } catch (e) {
      console.error("Failed to load status", e);
    }
  };

  const publishStatus = async (file: File) => {
    setStatusUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/status/media/", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Failed to upload status media");
      }

      const { mediaId, type } = uploadData as { mediaId: string; type: "image" | "video" };
      const res = await fetch("/api/status/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ type, mediaId, caption: statusCaption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish status");
      setStatusCaption("");
      await fetchStatusItems();
      const link = data.statusPageUrl || STATUS_PAGE_URL;
      alert(`Status published for 24 hours!\n\nShare this link with customers:\n${link}`);
    } catch (e: any) {
      alert("Failed to publish status: " + e.message);
    } finally {
      setStatusUploading(false);
    }
  };

  const deleteStatusItem = async (id: string) => {
    try {
      await fetch("/api/status/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ id }),
      });
      setStatusItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("Failed to delete status", e);
    }
  };

  const archiveContact = async (phone: string, archived: boolean) => {
    try {
      // Optimistic update in state
      setContacts((prev) =>
        prev.map((c) => {
          if (c.phone === phone) {
            const updated = { ...c, archived };
            if (activeChat?.phone === phone) {
              setActiveChat(updated.archived ? null : updated);
            }
            return updated;
          }
          return c;
        })
      );

      const res = await fetch(api("/api/messages/"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone, archived }),
      });
      if (!res.ok) {
        throw new Error("Failed to sync archive status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteContact = async (phone: string) => {
    if (!confirm("Are you sure you want to permanently delete this chat? This action cannot be undone.")) return;
    try {
      // Optimistic update in state
      setContacts((prev) => prev.filter((c) => c.phone !== phone));
      if (activeChat?.phone === phone) {
        setActiveChat(null);
      }

      const res = await fetch(api("/api/messages/"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete chat");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeChat) return;
    // For now, we'll implement local deletion. In a real app, you'd call an API to delete on WhatsApp.
    if (!confirm("Delete this message?")) return;
    
    setContacts((prev) =>
      prev.map((c) => {
        if (c.phone === activeChat.phone) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
            ),
          };
        }
        return c;
      })
    );

    if (activeChat.phone) {
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, isDeleted: true, text: "🚫 This message was deleted" } : m
          ),
        };
      });
    }

    try {
      await fetch(api("/api/messages/"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone: activeChat.phone, deleteMessageId: messageId }),
      });
    } catch (e) {}
  };

  const startChat = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      alert("Invalid phone number.");
      return;
    }

    const existing = contacts.find((c) => c.phone === cleanPhone);
    if (existing) {
      setActiveChat(existing);
    } else {
      const newContact: Contact = {
        name: name || "WhatsApp Contact",
        phone: cleanPhone,
        messages: [],
      };
      setContacts((prev) => [newContact, ...prev]);
      setActiveChat(newContact);
    }
    
    setIsNewChatOpen(false);
    setDirSearchQuery("");
    setCustomName("");
    setCustomPhone("");
  };

  const handleLogout = () => {
    localStorage.removeItem("inbox_password");
    inboxVersionRef.current = 0;
    setSessionToken(null);
    try {
      (window as any).Android?.clearSession?.();
      (window as any).Android?.setKeepScreenOn?.(false);
    } catch (e) {}
    setIsLoggedIn(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio" | "video" | "document") => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size limits early
      if (type === "video" && file.size > 16 * 1024 * 1024) {
        alert("Video is too large. WhatsApp max is 16 MB. Compress the file and try again.");
        return;
      }
      if (type === "video" && file.size > 4 * 1024 * 1024) {
        alert("This video is over 4 MB. It may fail to upload — compress it to under 4 MB first for best results.");
      }
      if (file.size > 100 * 1024 * 1024) {
        alert("File is too large. Maximum allowed size is 100MB (WhatsApp document limit).");
        return;
      }

      setPendingFile(file);
      setPendingFileType(type);
      setPendingLocation(null); // Clear location
      setShowAttachMenu(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setReplyText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        };
      };
    });
  };

  const handleShareCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPendingLocation({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            name: "Current Location",
            address: "Shared via Web Inbox",
          });
          setPendingFile(null); // Clear file
          setIsLocationModalOpen(false);
        },
        (error) => {
          alert("Error getting location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Filter contacts by search query AND active category tab
  const filteredContacts = contacts
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);

      if (activeTab === "archived") {
        return matchesSearch && c.archived && !c.blocked;
      }

      if (activeTab === "blocked") {
        return matchesSearch && c.blocked;
      }

      if (c.archived || c.blocked) return false;

      const matchesTab = activeTab === "all" ? true : c.tag === activeTab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      const aTime = a.messages[a.messages.length - 1]?.timestamp || 0;
      const bTime = b.messages[b.messages.length - 1]?.timestamp || 0;
      return bTime - aTime;
    });

  const blockedCount = contacts.filter((c) => c.blocked).length;
  const campaignUnreadCount = campaignContacts.reduce((n, c) => n + (c.hasUnread ? (c.unreadCount || 1) : 0), 0);
  const filteredCampaignContacts = campaignContacts
    .filter((c) => {
      if (!campaignSearch) return true;
      const q = campaignSearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    })
    .sort((a, b) => {
      const aTime = a.messages[a.messages.length - 1]?.timestamp || 0;
      const bTime = b.messages[b.messages.length - 1]?.timestamp || 0;
      return bTime - aTime;
    });
  const inboxTitle =
    activeTab === "blocked" ? "Blocked" :
    activeTab === "archived" ? "Archived" :
    activeTab === "all" ? "Inbox" :
    TAGS.find((t) => t.id === activeTab)?.label || "Inbox";

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20 overflow-hidden shadow-lg shadow-emerald-500/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="Pure Herbex Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{inboxLineTitle}</h1>
            <p className="text-zinc-400 text-sm mt-1">Unlock WhatsApp conversations</p>
          </div>

          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-all text-center text-lg tracking-widest"
              />
              <button
                type="submit"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-center"
              >
                Unlock Conversations
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  return (
    <div className="inbox-shell bg-[#0b141a] text-[#e9edef] min-h-screen flex h-screen overflow-hidden font-sans fixed inset-0">
      {refreshNote && (
        <div className="md:hidden fixed left-1/2 -translate-x-1/2 z-[60] inbox-refresh-toast pointer-events-none"
          style={{ top: "calc(var(--inbox-safe-top) + 0.25rem)" }}
        >
          <span className="px-3 py-1.5 rounded-full bg-[#202c33] border border-[#ffffff14] text-xs text-[#e9edef] shadow-lg">
            {refreshNote}
          </span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: Navigation / Utility Icons (Linear style) */}
      <aside className="hidden md:flex w-16 bg-zinc-900 border-r border-zinc-800/80 flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center space-y-8 w-full">
          {/* Logo Brand */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Pure Herbex Logo" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
            />
          </div>
          {/* Navigation Links */}
          <nav className="flex flex-col items-center space-y-4 w-full">
            <button
              onClick={() => {
                setViewMode("inbox");
                setActiveTab("all");
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "all" && viewMode === "inbox"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
              title="Inbox (All Chats)"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.586-3.586a2 2 0 00-2.828 0L16 11m-8 3V4"/>
              </svg>
            </button>

            {TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setViewMode("inbox");
                  setActiveTab(tag.id as any);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === tag.id && viewMode === "inbox"
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title={`Filter: ${tag.label}`}
              >
                <span className={`w-2 h-2 rounded-full ${tag.color}`}></span>
              </button>
            ))}

            <button
              onClick={() => {
                setViewMode("inbox");
                setActiveTab("archived");
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "archived" && viewMode === "inbox"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
              title="Archived Chats"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>

            <button
              onClick={() => {
                setViewMode("orders");
                setActiveChat(null);
                setActiveCampaignChat(null);
                setSelectedMarketingLead(null);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                viewMode === "orders"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
              }`}
              title="Orders CRM"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {orderSummary.counts.needsAction > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                  {orderSummary.counts.needsAction > 9 ? "9+" : orderSummary.counts.needsAction}
                </span>
              ) : orderSummary.counts.active > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-[9px] font-black text-zinc-950 rounded-full flex items-center justify-center">
                  {orderSummary.counts.active > 9 ? "9+" : orderSummary.counts.active}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => {
                setViewMode("status");
                setActiveChat(null);
                fetchStatusItems();
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                viewMode === "status"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
              }`}
              title="Status Updates"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button
              onClick={() => {
                setViewMode("inbox");
                setActiveTab("blocked");
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "blocked" && viewMode === "inbox"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
              }`}
              title="Blocked Contacts"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>

            <button
              onClick={() => {
                setViewMode("campaign");
                setActiveChat(null);
                setSelectedMarketingLead(null);
                fetchCampaignChats(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                viewMode === "campaign"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
              }`}
              title="Campaign Inbox"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {campaignUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-[9px] font-black text-zinc-950 rounded-full flex items-center justify-center">
                  {campaignUnreadCount > 9 ? "9+" : campaignUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setViewMode("promo");
                setActiveChat(null);
                setActiveCampaignChat(null);
                fetchCampaignStatus();
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                viewMode === "promo"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
              }`}
              title="Promo — Send Template"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {notifPermission !== "granted" && notifPermission !== "unsupported" && (
            <button
              onClick={requestNotifPermission}
              className="w-10 h-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl flex items-center justify-center transition-all animate-pulse"
              title="Enable Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-10 h-10 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center justify-center transition-all"
            title="Lock Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </button>
        </div>
      </aside>

      {viewMode === "orders" ? (
        <OrdersPanel
          sessionToken={sessionToken}
          onOpenChat={openChatFromCrm}
          focusOrderId={crmFocusOrderId}
          onFocusHandled={() => setCrmFocusOrderId(null)}
          onOrdersChanged={() => void fetchOrderSummary()}
        />
      ) : viewMode === "status" ? (
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          <div className="inbox-mobile-top px-5 pb-5 border-b border-zinc-800/60 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Status</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Web status page for customers (24h). WhatsApp Cloud API cannot post to WhatsApp Stories — share the link below.
            </p>
            <a href={STATUS_PAGE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">
              Open customer status page →
            </a>
            <p className="text-[10px] text-zinc-600 mt-1 break-all">{STATUS_PAGE_URL}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <h2 className="font-semibold text-sm text-zinc-200 mb-3">Add new status</h2>
              <input
                type="text"
                placeholder="Caption (optional)"
                value={statusCaption}
                onChange={(e) => setStatusCaption(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 mb-3"
              />
              <input
                ref={statusFileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) publishStatus(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={statusUploading}
                onClick={() => statusFileRef.current?.click()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition-all"
              >
                {statusUploading ? "Uploading..." : "Upload Image or Video"}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(STATUS_PAGE_URL);
                  alert(`Status link copied!\n\n${STATUS_PAGE_URL}`);
                }}
                className="w-full py-2.5 border border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-xl text-sm font-semibold"
              >
                Copy status page link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check our latest updates: ${STATUS_PAGE_URL}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 mt-2 mb-3 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25 rounded-xl text-sm font-semibold text-center"
              >
                Share link on WhatsApp
              </a>
              <p className="text-[11px] text-zinc-500 mt-2">Status is web-only for 24h. Use the Promo tab to send the herbex_marketing template to leads.</p>
            </div>

            <div>
              <h2 className="font-semibold text-sm text-zinc-200 mb-3">Active updates ({statusItems.length})</h2>
              {statusItems.length === 0 ? (
                <p className="text-sm text-zinc-600">No active status. Upload one above.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {statusItems.map((item) => (
                    <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[9/16]">
                      {item.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inboxStatusMediaSrc(item.mediaId)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={inboxStatusMediaSrc(item.mediaId)} className="w-full h-full object-cover" muted />
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-[10px] text-zinc-300 truncate">{item.caption || "No caption"}</p>
                        <p className="text-[9px] text-zinc-500">{Math.max(0, Math.round((item.expiresAt - Date.now()) / 3600000))}h left</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteStatusItem(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      ) : viewMode === "promo" ? (
        <>
          {/* MARKETING: Lead list */}
          <section className={`w-full md:w-96 bg-zinc-900/40 border-r border-zinc-800/80 flex flex-col overflow-hidden shrink-0 ${selectedMarketingLead ? "hidden md:flex" : "flex"}`}>
            <div className="inbox-mobile-top px-5 pb-5 border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-100">Promo</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Send template: {MARKETING_TEMPLATE}</p>
                </div>
                <button
                  onClick={() => void handleRefresh()}
                  className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"/>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-zinc-300">{marketingStats.pending}</div>
                  <div className="text-[10px] text-zinc-500">Pending</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-emerald-400">{marketingStats.sent}</div>
                  <div className="text-[10px] text-emerald-600">Sent</div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-rose-400">{marketingStats.failed}</div>
                  <div className="text-[10px] text-rose-600">Failed</div>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search leads..."
                value={marketingSearch}
                onChange={(e) => setMarketingSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 mb-2"
              />
              <select
                value={marketingFilter}
                onChange={(e) => setMarketingFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800/80 rounded-xl text-sm text-zinc-200"
              >
                <option value="all">All leads</option>
                <option value="pending">Pending only</option>
                <option value="sent">Sent only</option>
                <option value="failed">Failed only</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 pb-20 md:pb-3">
              {filteredMarketingLeads.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-8">No matching leads.</p>
              ) : (
                filteredMarketingLeads.map((lead) => {
                  const status = getLeadStatus(lead.phone);
                  return (
                    <button
                      key={lead.phone}
                      type="button"
                      onClick={() => setSelectedMarketingLead({ name: lead.name, phone: lead.phone, city: lead.city })}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedMarketingLead?.phone === lead.phone
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-zinc-950/40 border-zinc-800/30 hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-200 truncate">{lead.name}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">+{lead.phone}{lead.city ? ` · ${lead.city}` : ""}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                          status === "sent" ? "bg-emerald-500/20 text-emerald-400" :
                          status === "failed" ? "bg-rose-500/20 text-rose-400" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* MARKETING: Send panel */}
          <main className={`flex-1 flex flex-col bg-zinc-950 overflow-hidden ${selectedMarketingLead ? "flex" : "hidden md:flex"}`}>
            {selectedMarketingLead ? (
              <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-2xl mx-auto w-full">
                {isMobile && (
                  <button
                    onClick={() => setSelectedMarketingLead(null)}
                    className="mb-4 text-sm text-emerald-400 flex items-center gap-1"
                  >
                    ← Back to leads
                  </button>
                )}

                <h2 className="text-2xl font-bold text-zinc-100 mb-1">{selectedMarketingLead.name}</h2>
                <p className="text-zinc-500 text-sm mb-6">+{selectedMarketingLead.phone}{selectedMarketingLead.city ? ` · ${selectedMarketingLead.city}` : ""}</p>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mb-6">
                  <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Approved Template</div>
                  <div className="text-emerald-400 font-semibold">{MARKETING_TEMPLATE}</div>
                  <p className="text-zinc-500 text-xs mt-2">Bypasses the 24-hour window. Includes product image header. Fixed text — no name placeholder.</p>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 mb-6">
                  <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Status</div>
                  {(() => {
                    const st = campaignStatus[selectedMarketingLead.phone];
                    if (st?.status === "sent") {
                      return (
                        <div className="text-emerald-400 text-sm">
                          Sent {st.sentAt ? new Date(st.sentAt).toLocaleString() : ""}
                          {st.messageId && <div className="text-zinc-500 text-xs mt-1">ID: {st.messageId}</div>}
                        </div>
                      );
                    }
                    if (st?.status === "failed") {
                      return <div className="text-rose-400 text-sm">{st.error || "Send failed"}</div>;
                    }
                    return <div className="text-zinc-400 text-sm">Not sent yet — ready to send</div>;
                  })()}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    disabled={isSendingCampaign}
                    onClick={async () => {
                      const ok = await sendTemplateToLead(
                        selectedMarketingLead.phone,
                        selectedMarketingLead.name,
                        selectedMarketingLead.city
                      );
                      if (ok) alert("Template sent successfully!");
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold rounded-2xl transition-all"
                  >
                    {isSendingCampaign ? "Sending..." : `Send ${MARKETING_TEMPLATE}`}
                  </button>

                  {campaignStatus[selectedMarketingLead.phone] && (
                    <button
                      onClick={() => resetLeadCampaignStatus(selectedMarketingLead.phone)}
                      className="w-full py-3 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl text-sm"
                    >
                      Reset to Pending
                    </button>
                  )}

                  <button
                    onClick={() => startCampaignChat(selectedMarketingLead.phone, selectedMarketingLead.name)}
                    className="w-full py-3 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl text-sm font-semibold"
                  >
                    Open in Campaign Inbox
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 md:p-8 max-w-2xl mx-auto w-full overflow-y-auto">
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">Promo — Marketing Template</h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Send the approved <span className="text-emerald-400 font-semibold">{MARKETING_TEMPLATE}</span> template to leads. This is separate from Status updates.
                </p>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mb-6">
                  <div className="text-sm font-bold text-zinc-200 mb-4">Test Send</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Phone (923001234567)"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200"
                    />
                    <p className="text-xs text-zinc-500">Template uses fixed text + product image. Name/city fields are optional labels only.</p>
                    <button
                      disabled={!testPhone || isSendingCampaign}
                      onClick={async () => {
                        const ok = await sendTemplateToLead(testPhone, testName, testCity);
                        if (ok) alert("Test template sent! Check WhatsApp on that phone.");
                      }}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold rounded-xl"
                    >
                      {isSendingCampaign ? "Sending..." : "Send Test Template"}
                    </button>
                  </div>
                </div>

                <button
                  disabled={isSendingCampaign || marketingStats.pending === 0}
                  onClick={() => sendBatchMarketing(20)}
                  className="w-full py-4 mb-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold rounded-2xl"
                >
                  {isSendingCampaign ? "Sending batch..." : `Send to next 20 pending (${marketingStats.pending} left)`}
                </button>

                <div className="text-zinc-600 text-xs leading-relaxed">
                  <p>• {marketingLeads.length} leads loaded from contacts.json</p>
                  <p>• Template works outside the 24-hour window (approved marketing)</p>
                  <p>• Use Test Send first, then batch or one-by-one from the list</p>
                  <p className="text-amber-500/90 mt-2">• If Meta shows error <strong>130472</strong>, that number is in a Meta experiment — they must message you first, or try a different number. You are not charged.</p>
                </div>
              </div>
            )}
          </main>
        </>
      ) : viewMode === "campaign" ? (
        <>
          <section className={`w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/80 flex flex-col overflow-hidden shrink-0 ${activeCampaignChat ? "hidden md:flex" : "flex"}`}>
            <div className="inbox-mobile-top px-5 pb-5 border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-amber-400">Campaign Inbox</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Marketing sends &amp; replies only</p>
                </div>
                <button
                  onClick={() => void handleRefresh()}
                  className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"/>
                  </svg>
                </button>
              </div>
              <input
                type="text"
                placeholder="Search campaign contacts..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 pb-20 md:pb-3">
              {filteredCampaignContacts.length === 0 ? (
                <div className="text-center text-zinc-600 text-sm mt-12 px-4">
                  <p>No campaign conversations yet.</p>
                  <p className="text-xs mt-2 text-zinc-500">Send promos from the Promo tab — they appear here, not in main Chats.</p>
                </div>
              ) : (
                filteredCampaignContacts.map((c) => {
                  const latestMsg = c.messages[c.messages.length - 1];
                  const latestText = formatMessagePreview(latestMsg, "No messages");
                  const latestTime = latestMsg
                    ? new Date(latestMsg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <button
                      key={c.phone}
                      type="button"
                      onClick={() => {
                        setActiveCampaignChat(c);
                        if (c.hasUnread) markCampaignChatRead(c.phone);
                      }}
                      className={`w-full text-left flex items-start space-x-3 px-4 py-3.5 rounded-2xl border transition-all ${
                        activeCampaignChat?.phone === c.phone
                          ? "bg-amber-500/10 border-amber-500/30"
                          : c.hasUnread
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "border-transparent hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full shrink-0 bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-sm truncate text-zinc-200">{c.name}</h3>
                          <span className="text-[10px] text-zinc-500">{latestTime}</span>
                        </div>
                        <p className="text-xs truncate mt-0.5 text-zinc-500">{latestText}</p>
                      </div>
                      {c.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <main className={`flex-1 flex flex-col bg-zinc-950 overflow-hidden ${activeCampaignChat ? "flex max-md:fixed max-md:inset-0 max-md:z-50" : "hidden md:flex"}`}>
            {activeCampaignChat ? (
              <>
                <div className="inbox-header-bar inbox-mobile-top px-3 pb-2.5 md:px-6 md:py-4 md:pt-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveCampaignChat(null)}
                      className="md:hidden mr-3 p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <h2 className="font-bold text-sm text-zinc-100">{activeCampaignChat.name}</h2>
                      <span className="text-[10px] text-amber-400/80">Campaign · +{activeCampaignChat.phone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => promoteToMainInbox(activeCampaignChat.phone)}
                    className="px-3 py-1.5 text-xs font-bold border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/10"
                    title="When they become a real customer"
                  >
                    Move to Main Inbox
                  </button>
                </div>

                <div className="inbox-chat-wallpaper flex-1 overflow-y-auto px-3 py-4 space-y-1">
                  {activeCampaignChat.messages.map((msg) => {
                    const isMe = msg.sender === "me";
                    const msgTime = formatChatTime(msg.timestamp);
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} py-0.5`}>
                        <div
                          className={`max-w-[82%] px-2.5 py-1.5 text-sm ${isMe ? "inbox-bubble-out" : "inbox-bubble-in"} ${
                            !isMe && isMessageUnread(msg) ? "inbox-bubble-unread" : ""
                          }`}
                        >
                          <MessageContent msg={msg} isMe={isMe} quoteChat={activeCampaignChat} />
                          <div className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] ${isMe ? "text-[#ffffff99]" : "text-[#8696a0]"}`}>
                            <span>{msgTime}</span>
                            <DeliveryTicks msg={msg} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleCampaignSend} className="p-4 border-t border-zinc-800/80 shrink-0 safe-bottom">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply within 24h window..."
                      className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold rounded-2xl"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mb-2">Campaign Inbox</h2>
                <p className="text-zinc-500 text-sm max-w-md">
                  All marketing template sends and replies live here — separate from your main customer chats.
                </p>
              </div>
            )}
          </main>
        </>
      ) : (
        <>
      {/* 2. MIDDLE COLUMN: Conversation Lists (Sleek List View) */}
      <section className={`w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/80 flex flex-col overflow-hidden shrink-0 ${activeChat ? "hidden md:flex" : "flex"}`}>
        
        {/* Header Section */}
        <div className="inbox-mobile-top px-5 pb-5 border-b border-zinc-800/60 shrink-0 relative">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">{inboxTitle}</h1>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleExportContacts("csv")}
                disabled={isExportingContacts}
                className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all disabled:opacity-50"
                title="Export contacts (CSV: name, phone, tag)"
              >
                <svg className={`w-4 h-4 ${isExportingContacts ? "animate-pulse text-emerald-400" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
              </button>
              <button
                onClick={() => void handleRefresh()}
                className={`w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all`}
                title="Refresh Chats"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12"/>
                </svg>
              </button>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold rounded-lg flex items-center justify-center transition-all shadow-lg shadow-emerald-500/10"
                title="New Chat"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />

          {/* Mobile tag filters — keeps bottom nav uncluttered */}
          <div className="md:hidden flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => { setViewMode("inbox"); setActiveTab("all"); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${activeTab === "all" && viewMode === "inbox" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "border-zinc-800 text-zinc-500"}`}
            >
              All
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => { setViewMode("inbox"); setActiveTab(tag.id as any); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${activeTab === tag.id && viewMode === "inbox" ? `${tag.bg} ${tag.border} ${tag.text}` : "border-zinc-800 text-zinc-500"}`}
              >
                {tag.label.split(" ")[0]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setViewMode("inbox"); setActiveTab("archived"); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${activeTab === "archived" ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "border-zinc-800 text-zinc-500"}`}
            >
              Archived
            </button>
          </div>
        </div>
        
        {/* Chats list */}
        <div className="flex-1 overflow-y-auto space-y-1 p-3 pb-20 md:pb-3">
          {filteredContacts.length === 0 ? (
            <div className="text-center text-zinc-600 text-sm mt-12 px-4">
              <svg className="w-8 h-8 mx-auto text-zinc-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p>{activeTab === "blocked" ? "No blocked contacts." : "No chats found in this category."}</p>
            </div>
          ) : (
            filteredContacts.map((c) => {
              const latestMsg = c.messages[c.messages.length - 1];
              const latestText = formatMessagePreview(latestMsg);
              const latestTime = latestMsg
                ? new Date(latestMsg.timestamp * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              const isActive = activeChat?.phone === c.phone;
              const contactTag = TAGS.find((t) => t.id === c.tag);

              return (
                <div
                  key={c.phone}
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedMessageIds(new Set());
                    setActiveChat(c);
                    if (c.hasUnread && !c.blocked) markChatRead(c.phone);
                  }}
                  className={`group w-full text-left flex items-start space-x-3 px-4 py-3.5 rounded-2xl transition-all border cursor-pointer relative ${
                    isActive
                      ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-lg scale-[1.02] z-10"
                      : c.hasUnread 
                        ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200"
                        : "border-transparent hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {/* Unread Indicator Bar */}
                  {c.hasUnread && !isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  )}
                  <div className="w-10 h-10 rounded-full shrink-0 relative mt-0.5 overflow-hidden bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}&radius=50&backgroundColor=0d9488,0f766e,115e59,134e4a,0f172a`} 
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                    {c.tag && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${contactTag?.color}`}></span>
                    )}
                    {/* Unread dot on avatar */}
                    {c.hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-black text-zinc-950">{(c.unreadCount || 0) > 9 ? "9+" : (c.unreadCount || 1)}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className={`font-semibold text-sm truncate flex items-center gap-1 ${ c.hasUnread ? "text-zinc-100" : "text-zinc-200" }`}>
                        {c.pinned && (
                          <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                        )}
                        {c.name}
                        {orderSummary.byPhone[c.phone] && (
                          <span
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-md shrink-0 ${
                              orderSummary.byPhone[c.phone].needsAddress ||
                              orderSummary.byPhone[c.phone].needsTracking
                                ? "bg-amber-500/25 text-amber-300"
                                : "bg-amber-500/15 text-amber-400/80"
                            }`}
                            title="Active order in CRM"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1 ml-1 shrink-0">
                        {c.hasUnread && (
                          <span className="text-emerald-400">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18 6.41L16.59 5 12 9.58 7.41 5 6 6.41l6 6z"/><path d="M18 13l-1.41-1.41L12 16.17l-4.59-4.58L6 13l6 6z"/></svg>
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 group-hover:opacity-0 transition-opacity duration-200">
                          {latestTime}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs truncate mt-0.5 leading-normal pr-8 ${ c.hasUnread ? "text-zinc-300 font-medium" : "" }`}>{latestText}</p>
                    {/* Tag pill */}
                    {contactTag && !c.blocked && (
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1.5 rounded-md text-[9px] font-semibold border ${contactTag.text} ${contactTag.border} ${contactTag.bg}`}>
                        {contactTag.label}
                      </span>
                    )}
                    {c.blocked && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1.5 rounded-md text-[9px] font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-400">
                        Blocked
                      </span>
                    )}
                  </div>

                  {c.blocked && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); blockContact(c.phone, false); }}
                      className="absolute right-12 top-3.5 md:right-14 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30"
                    >
                      Unblock
                    </button>
                  )}

                  {/* Contact menu (mobile) */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setContactMenuTarget(c); }}
                    className="absolute right-3 top-3.5 md:hidden p-1.5 text-zinc-500 hover:text-zinc-200"
                    title="Chat options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>

                  {/* Hover Actions Panel */}
                  <div 
                    className="absolute right-4 top-3.5 hidden md:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => pinContact(c.phone, !c.pinned)}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors"
                      title={c.pinned ? "Unpin Chat" : "Pin Chat"}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                    </button>
                    <button
                      onClick={() => archiveContact(c.phone, !c.archived)}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-250 transition-colors"
                      title={c.archived ? "Unarchive Chat" : "Archive Chat"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {c.archived ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteContact(c.phone)}
                      className="p-1.5 hover:bg-rose-955 rounded-lg text-zinc-505 hover:text-rose-455 transition-colors"
                      title="Delete Chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. RIGHT COLUMN: Active Chat Messages panel (Minimalistic details) */}
      <main className={`flex-1 flex flex-col bg-zinc-950 overflow-hidden relative ${activeChat ? "max-md:fixed max-md:inset-0 max-md:z-50 max-md:flex max-md:h-[100dvh] flex" : "hidden md:flex"}`}>
        {activeChat ? (
          <>
            {/* Chat Info Header */}
            <div className="inbox-header-bar inbox-mobile-top px-3 pb-2.5 md:px-6 md:py-4 md:pt-4 flex items-center justify-between shrink-0 relative z-40">
              {isSelectMode ? (
                <div className="flex items-center justify-between w-full animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => { setIsSelectMode(false); setSelectedMessageIds(new Set()); }}
                      className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                    <span className="font-bold text-emerald-400">{selectedMessageIds.size} Selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={selectAllMessages}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button 
                      onClick={handleBulkForward}
                      disabled={selectedMessageIds.size === 0}
                      className="p-2 hover:bg-emerald-500/10 text-emerald-400 disabled:opacity-30 rounded-full transition-colors"
                      title="Forward Selected"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                      </svg>
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      disabled={selectedMessageIds.size === 0}
                      className="p-2 hover:bg-rose-500/10 text-rose-400 disabled:opacity-30 rounded-full transition-colors"
                      title="Delete Selected"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="md:hidden mr-3 p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                      title="Back to Chats"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeChat.name)}&radius=50&backgroundColor=0d9488,0f766e,115e59,134e4a,0f172a`} 
                        alt={activeChat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-3">
                      <h2 className="font-bold text-sm leading-none text-zinc-100">{activeChat.name}</h2>
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        +{activeChat.phone}
                      </span>
                    </div>
                  </div>

                  {/* Header Actions & Tags Selector — icon-only on mobile */}
                  <div className="flex items-center gap-1.5">
                    {activeChat.blocked && (
                      <button
                        onClick={() => blockContact(activeChat.phone, false)}
                        className="px-2.5 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold hover:bg-emerald-500/30"
                      >
                        Unblock
                      </button>
                    )}
                    <button
                      onClick={() => pinContact(activeChat.phone, !activeChat.pinned)}
                      className={`p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all ${activeChat.pinned ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"}`}
                      title={activeChat.pinned ? "Unpin Chat" : "Pin Chat"}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                    </button>
                    {activeChat.hasUnread ? (
                      <button
                        onClick={() => markChatRead(activeChat.phone)}
                        className="p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
                        title="Mark all as read"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    ) : contactHasIncoming(activeChat) ? (
                      <button
                        onClick={() => markChatUnread(activeChat.phone)}
                        className="p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
                        title="Mark all as unread"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </button>
                    ) : null}
                    <button
                      onClick={() => setContactMenuTarget(activeChat)}
                      className="md:hidden p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
                      title="More options"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <button
                      onClick={() => archiveContact(activeChat.phone, !activeChat.archived)}
                      className="p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
                      title={activeChat.archived ? "Unarchive Chat" : "Archive Chat"}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {activeChat.archived ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        )}
                      </svg>
                      <span className="hidden sm:inline">{activeChat.archived ? "Unarchive" : "Archive"}</span>
                    </button>
                    <button
                      onClick={() => deleteContact(activeChat.phone)}
                      className="p-2 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/40 rounded-xl text-zinc-500 hover:text-rose-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
                      title="Delete Chat"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addToOrdersCrm(activeChat.phone, activeChat.name, true)}
                      className="p-2 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 rounded-xl text-zinc-500 hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
                      title="Add to Orders CRM"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="hidden sm:inline">CRM</span>
                    </button>
                    <select
                      value={activeChat.tag || ""}
                      onChange={(e) => updateContactTag(activeChat.phone, (e.target.value as any) || null)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer max-w-[110px] sm:max-w-none"
                      title="Tag Conversation"
                    >
                      <option value="">No Tag</option>
                      {TAGS.map((tag) => (
                        <option key={tag.id} value={tag.id}>{tag.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Message History Bubble list */}
            <div className="inbox-chat-wallpaper flex-1 overflow-y-auto px-3 py-4 md:px-6 space-y-1 flex flex-col">
              {activeChat.messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-200">Start the Conversation</h3>
                  <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
                    This is the start of your chat history with <span className="text-zinc-300 font-semibold">{activeChat.name}</span>. Send a message below to start.
                  </p>
                </div>
              ) : (
                activeChat.messages.map((msg) => {
                  const isMe = msg.sender === "me";
                  const msgTime = formatChatTime(msg.timestamp);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} items-center gap-2 py-0.5`}
                    >
                      {isSelectMode && (
                        <div 
                          onClick={() => toggleMessageSelection(msg.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                            selectedMessageIds.has(msg.id)
                              ? "bg-[#00a884] border-[#00a884] text-[#0b141a]"
                              : "border-[#8696a0] hover:border-[#00a884]"
                          }`}
                        >
                          {selectedMessageIds.has(msg.id) && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}

                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isSelectMode) {
                            toggleMessageSelection(msg.id);
                          } else {
                            setActiveMenuMessageId(msg.id);
                          }
                        }}
                        onMouseDown={() => {
                          if (!isSelectMode) {
                            clearLongPressTimer();
                            longPressTimerRef.current = setTimeout(() => handleMessageLongPress(msg.id), 500);
                          }
                        }}
                        onMouseUp={clearLongPressTimer}
                        onMouseLeave={clearLongPressTimer}
                        onTouchStart={() => {
                          if (!isSelectMode) {
                            clearLongPressTimer();
                            longPressTimerRef.current = setTimeout(() => handleMessageLongPress(msg.id), 500);
                          }
                        }}
                        onTouchEnd={clearLongPressTimer}
                        onTouchMove={clearLongPressTimer}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (longPressTriggeredRef.current) {
                            longPressTriggeredRef.current = false;
                            return;
                          }
                          if (isSelectMode) {
                            toggleMessageSelection(msg.id);
                          } else {
                            setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                          }
                        }}
                        className={`max-w-[82%] sm:max-w-[70%] px-2.5 py-1.5 text-sm relative cursor-pointer select-none transition-all ${
                          selectedMessageIds.has(msg.id) ? "ring-2 ring-[#00a884]/50 opacity-90" : ""
                        } ${isMe ? "inbox-bubble-out" : "inbox-bubble-in"} ${
                          !isMe && isMessageUnread(msg) ? "inbox-bubble-unread" : ""
                        }`}
                      >
                        <MessageContent
                          msg={msg}
                          isMe={isMe}
                          quoteChat={activeChat}
                          onUpdateAgentNote={(id, note) =>
                            saveMessageAgentNote(activeChat.phone, id, note)
                          }
                        />
                        
                        <div
                          className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] ${
                            isMe ? "text-[#ffffff99]" : "text-[#8696a0]"
                          }`}
                        >
                          <span>{msgTime}</span>
                          <DeliveryTicks msg={msg} />
                        </div>

                        {activeMenuMessageId === msg.id && (
                          <div 
                            className="inbox-context-menu absolute right-0 top-full mt-1 rounded-lg py-1 z-50 w-44 text-[#e9edef]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startSelectMode(msg.id);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3"
                            >
                              <svg className="w-4 h-4 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              Select
                            </button>
                            {!isMe && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markMessageReadState(activeChat.phone, msg.id, isMessageUnread(msg));
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3"
                              >
                                <svg className="w-4 h-4 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {isMessageUnread(msg) ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  )}
                                </svg>
                                {isMessageUnread(msg) ? "Mark as read" : "Mark as unread"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3"
                            >
                              <svg className="w-4 h-4 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                              Reply
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForwardMessage(msg);
                                setForwardMessages([]);
                                setSelectedForwardContacts([]);
                                setIsForwardModalOpen(true);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3"
                            >
                              <svg className="w-4 h-4 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                              Forward
                            </button>
                            {isMe && (msg.type === "voice" || msg.type === "audio" || msg.isVoiceNote) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const next = window.prompt(
                                    "Voice label (only you see this):",
                                    msg.agentNote || ""
                                  );
                                  if (next !== null) {
                                    saveMessageAgentNote(activeChat.phone, msg.id, next);
                                  }
                                  setActiveMenuMessageId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3"
                              >
                                <svg className="w-4 h-4 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-6 4h10M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                                </svg>
                                {msg.agentNote ? "Edit voice label" : "Add voice label"}
                              </button>
                            )}
                            {msg.text && !msg.isDeleted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(msg.text);
                                  setActiveMenuMessageId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3"
                              >
                                <svg className="w-4 h-4 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                Copy
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(msg.id);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 text-rose-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="inbox-input-bar px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:p-4 border-t border-[#ffffff14] shrink-0 relative">
              {isSelectMode ? (
                <div className="flex items-center justify-between gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm text-emerald-300 font-semibold">
                    Tap messages to select, then use Forward above
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsSelectMode(false); setSelectedMessageIds(new Set()); }}
                    className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : activeChat.blocked ? (
                <div className="flex items-center justify-between gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-rose-300">Contact blocked</p>
                    <p className="text-[11px] text-zinc-500">They cannot message you and you cannot reply until you unblock.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => blockContact(activeChat.phone, false)}
                    className="shrink-0 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-lg"
                  >
                    Unblock
                  </button>
                </div>
              ) : (
              <>
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-zinc-900 border-l-4 border-emerald-500 rounded-r-2xl flex items-center justify-between animate-slide-up">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-emerald-400 text-[10px] font-bold uppercase mb-0.5">
                      Replying to {replyingTo.sender === "me" ? "yourself" : activeChat.name}
                    </div>
                    <div className="text-zinc-400 text-xs truncate">
                      {replyingTo.type === "image" ? "📷 Photo" :
                       replyingTo.type === "audio" || replyingTo.type === "voice" ? "🎵 Voice Note" :
                       replyingTo.text}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Previews of pending files/locations */}
              {pendingFile && (
                <div className="mb-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/10 font-bold text-xs uppercase">
                      {pendingFileType === "image" ? "IMG" : pendingFileType === "video" ? "VID" : pendingFileType === "audio" ? "AUD" : "DOC"}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs block truncate text-zinc-200">{pendingFile.name}</span>
                      <span className="text-[10px] text-zinc-500 block">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB • Ready to send</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPendingFile(null); setPendingFileType(null); }}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              )}

              {pendingLocation && (
                <div className="mb-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs block truncate text-zinc-200">{pendingLocation.name}</span>
                      <span className="text-[10px] text-zinc-500 block">{pendingLocation.latitude}, {pendingLocation.longitude}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingLocation(null)}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl z-40 w-64 animate-slide-up">
                  <div className="grid grid-cols-4 gap-2">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:bg-zinc-800 p-2 rounded-xl transition-all active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment Menu Popup */}
              {showAttachMenu && (
                <div className="absolute bottom-20 left-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-3 shadow-2xl z-40 w-48 space-y-1 animate-slide-up">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*";
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-zinc-800/80 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all text-xs font-semibold"
                  >
                    <span className="text-emerald-400">📷</span>
                    <span>Photo / Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "video/mp4,video/*,.mp4,.mov";
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-zinc-800/80 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all text-xs font-semibold"
                  >
                    <span className="text-emerald-400">🎥</span>
                    <span>Video (MP4, max 4 MB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "audio/*";
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-zinc-800/80 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all text-xs font-semibold"
                  >
                    <span className="text-emerald-400">🎵</span>
                    <span>Audio / Voice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "*/*";
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-zinc-800/80 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all text-xs font-semibold"
                  >
                    <span className="text-emerald-400">📄</span>
                    <span>Document File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocationModalOpen(true);
                      setShowAttachMenu(false);
                    }}
                    className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-zinc-800/80 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all text-xs font-semibold"
                  >
                    <span className="text-emerald-400">📍</span>
                    <span>Share Location</span>
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const accept = fileInputRef.current?.accept || "";
                  let type: "image" | "audio" | "video" | "document" = "document";
                  if (accept.includes("image")) type = "image";
                  else if (accept.includes("video")) type = "video";
                  else if (accept.includes("audio")) type = "audio";
                  handleFileSelect(e, type);
                }}
              />

              {isRecording ? (
                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex-1 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-zinc-300 text-sm font-semibold">Recording voice note: {formatDuration(recordingDuration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="w-10 h-10 hover:bg-zinc-800 rounded-lg text-rose-400 hover:text-rose-300 flex items-center justify-center transition-all active:scale-90"
                      title="Cancel Recording"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={stopAndSendRecording}
                      className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-zinc-955 flex items-center justify-center transition-all active:scale-90"
                      title="Send Voice Note"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-1 md:gap-2 min-w-0 w-full">
                  <button
                    type="button"
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
                    className={`w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center transition-all shrink-0 border border-zinc-800/80 hover:bg-zinc-900 active:scale-95 ${
                      showEmojiPicker ? "bg-zinc-900 border-zinc-700 text-emerald-400" : "bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-lg md:text-xl">😀</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
                    className={`w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center transition-all shrink-0 border border-zinc-800/80 hover:bg-zinc-900 active:scale-95 ${
                      showAttachMenu ? "bg-zinc-900 border-zinc-700 text-emerald-400" : "bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={pendingFile ? "Caption..." : "Type a message..."}
                    autoComplete="off"
                    className="flex-1 min-w-0 px-3 py-2 md:px-5 md:py-3.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg md:rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  />
                  
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center transition-all shrink-0 border border-zinc-800/80 hover:bg-zinc-900 active:scale-95 bg-zinc-900/40 text-zinc-400 hover:text-emerald-400"
                    title="Record Voice Note"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-9 h-9 md:w-auto md:px-5 md:py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-955 font-bold rounded-full md:rounded-xl text-sm transition-all flex items-center justify-center disabled:opacity-55 shrink-0"
                    title="Send message"
                  >
                    <svg className="w-5 h-5 md:hidden rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    <span className="hidden md:inline">{sending ? "Sending..." : "Send"}</span>
                  </button>
                </form>
              )}
              </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800/80 rounded-2xl flex items-center justify-center text-zinc-600 mb-4 shadow-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-200">No Conversation Selected</h2>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm">
              Select a contact from the sidebar or click the plus <span className="text-emerald-400 font-semibold">+</span> icon to start a new chat.
            </p>
          </div>
        )}
      </main>
        </>
      )}

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
            <button
              onClick={() => setIsNewChatOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h2 className="text-xl font-bold mb-4 pr-8">New Conversation</h2>

            {/* Tab Headers */}
            <div className="flex border-b border-zinc-800 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setNewChatTab("directory")}
                className={`flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 ${
                  newChatTab === "directory"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Search Directory
              </button>
              <button
                type="button"
                onClick={() => setNewChatTab("custom")}
                className={`flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 ${
                  newChatTab === "custom"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Enter Number
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
              {newChatTab === "directory" ? (
                <>
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={dirSearchQuery}
                    onChange={(e) => setDirSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 mb-3 shrink-0"
                  />
                  <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    {directoryContacts
                      .filter(
                        (dc) =>
                          dc.name.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
                          dc.phone.includes(dirSearchQuery)
                      )
                      .slice(0, 30) // Limit display to 30 results for rendering speed
                      .map((dc) => (
                        <button
                          key={dc.phone}
                          type="button"
                          onClick={() => startChat(dc.phone, dc.name)}
                          className="w-full text-left flex justify-between items-center px-4 py-3 bg-zinc-950/40 hover:bg-zinc-800/50 border border-zinc-800/30 rounded-xl transition-all"
                        >
                          <div>
                            <div className="text-sm font-semibold text-zinc-200">{dc.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">+{dc.phone}</div>
                          </div>
                          <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                            Chat
                          </span>
                        </button>
                      ))}
                    {directoryContacts.filter(
                      (dc) =>
                        dc.name.toLowerCase().includes(dirSearchQuery.toLowerCase()) ||
                        dc.phone.includes(dirSearchQuery)
                    ).length === 0 && (
                      <p className="text-center text-zinc-500 text-sm py-8">No matching contacts found.</p>
                    )}
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    startChat(customPhone, customName);
                  }}
                  className="space-y-4 pt-2"
                >
                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1.5">Phone Number (with Country Code)</label>
                    <input
                      type="text"
                      placeholder="e.g. 923160924151"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1.5">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold rounded-xl shadow-lg transition-all text-sm"
                  >
                    Start Chat
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col">
            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h2 className="text-xl font-bold mb-4 text-zinc-200">Share Location</h2>

            <button
              type="button"
              onClick={handleShareCurrentLocation}
              className="w-full py-3 mb-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/20 transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>📍</span>
              <span>Use Current Geolocation</span>
            </button>

            <div className="relative flex py-2 items-center shrink-0">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-500 text-xs font-semibold">OR MANUALLY ENTER</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsLocationModalOpen(false);
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 font-semibold mb-1.5">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 31.5204"
                    required
                    value={pendingLocation?.latitude || ""}
                    onChange={(e) => setPendingLocation({
                      latitude: e.target.value,
                      longitude: pendingLocation?.longitude || "",
                      name: pendingLocation?.name || "Shared Location",
                      address: pendingLocation?.address || "",
                    })}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 font-semibold mb-1.5">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 74.3587"
                    required
                    value={pendingLocation?.longitude || ""}
                    onChange={(e) => setPendingLocation({
                      latitude: pendingLocation?.latitude || "",
                      longitude: e.target.value,
                      name: pendingLocation?.name || "Shared Location",
                      address: pendingLocation?.address || "",
                    })}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 font-semibold mb-1.5">Place Name</label>
                <input
                  type="text"
                  placeholder="e.g. Office / Shop HQ"
                  value={pendingLocation?.name || ""}
                  onChange={(e) => setPendingLocation({
                    latitude: pendingLocation?.latitude || "",
                    longitude: pendingLocation?.longitude || "",
                    name: e.target.value,
                    address: pendingLocation?.address || "",
                  })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 font-semibold mb-1.5">Full Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Main Boulevard Road, Lahore"
                  value={pendingLocation?.address || ""}
                  onChange={(e) => setPendingLocation({
                    latitude: pendingLocation?.latitude || "",
                    longitude: pendingLocation?.longitude || "",
                    name: pendingLocation?.name || "Shared Location",
                    address: e.target.value,
                  })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-955 font-bold rounded-xl shadow-lg transition-all text-sm"
              >
                Confirm Location Attachment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact context menu (WhatsApp-style) */}
      {contactMenuTarget && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-zinc-950/70 backdrop-blur-sm" onClick={() => setContactMenuTarget(null)}>
          <div className="w-full md:max-w-sm bg-zinc-900 border border-zinc-800 rounded-t-3xl md:rounded-3xl p-2 shadow-2xl safe-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-zinc-800 mb-1">
              <p className="font-bold text-zinc-100">{contactMenuTarget.name}</p>
              <p className="text-xs text-zinc-500">+{contactMenuTarget.phone}</p>
            </div>
            {[
              {
                label: orderSummary.byPhone[contactMenuTarget.phone]
                  ? "Open in Orders CRM"
                  : "Add to Orders CRM",
                action: () => {
                  void openCrmForPhone(contactMenuTarget.phone, contactMenuTarget.name);
                },
              },
              { label: contactMenuTarget.pinned ? "Unpin chat" : "Pin chat", action: () => pinContact(contactMenuTarget.phone, !contactMenuTarget.pinned) },
              ...(contactMenuTarget.hasUnread
                ? [{ label: "Mark as read", action: () => markChatRead(contactMenuTarget.phone) }]
                : contactHasIncoming(contactMenuTarget)
                  ? [{ label: "Mark as unread", action: () => markChatUnread(contactMenuTarget.phone) }]
                  : []),
              { label: contactMenuTarget.archived ? "Unarchive chat" : "Archive chat", action: () => archiveContact(contactMenuTarget.phone, !contactMenuTarget.archived) },
              { label: contactMenuTarget.blocked ? "Unblock" : "Block", action: () => blockContact(contactMenuTarget.phone, !contactMenuTarget.blocked), danger: true },
              { label: "Delete chat", action: () => deleteContact(contactMenuTarget.phone), danger: true },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => { opt.action(); setContactMenuTarget(null); }}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-colors hover:bg-zinc-800 ${opt.danger ? "text-rose-400" : "text-zinc-200"}`}
              >
                {opt.label}
              </button>
            ))}
            <button type="button" onClick={() => setContactMenuTarget(null)} className="w-full px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300">Cancel</button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!activeChat && !activeCampaignChat && !selectedMarketingLead && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 min-h-16 bg-zinc-900 border-t border-zinc-800/80 flex items-stretch justify-around z-40 px-1 inbox-mobile-bottom pt-2">
          <button
            onClick={() => { setViewMode("inbox"); setActiveTab("all"); setActiveCampaignChat(null); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 ${
              activeTab === "all" && viewMode === "inbox" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.586-3.586a2 2 0 00-2.828 0L16 11m-8 3V4"/>
            </svg>
            <span className="text-[9px] font-bold">Chats</span>
          </button>

          <button
            onClick={() => { setViewMode("campaign"); setActiveChat(null); setSelectedMarketingLead(null); fetchCampaignChats(false); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 relative ${
              viewMode === "campaign" ? "text-amber-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] font-bold">Campaign</span>
            {campaignUnreadCount > 0 && (
              <span className="absolute top-1.5 right-[18%] min-w-[14px] h-[14px] px-0.5 bg-amber-500 text-[8px] font-black text-zinc-950 rounded-full flex items-center justify-center">
                {campaignUnreadCount > 9 ? "9+" : campaignUnreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setViewMode("orders");
              setActiveChat(null);
              setActiveCampaignChat(null);
              setSelectedMarketingLead(null);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 relative ${
              viewMode === "orders" ? "text-amber-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[9px] font-bold">Orders</span>
          </button>

          <button
            onClick={() => {
              setViewMode("promo");
              setActiveChat(null);
              setActiveCampaignChat(null);
              fetchCampaignStatus();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 ${
              viewMode === "promo" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span className="text-[9px] font-bold">Promo</span>
          </button>
        </nav>
      )}

      {/* Forward Message Modal */}
      {isForwardModalOpen && (forwardMessage || forwardMessages.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => {
                setIsForwardModalOpen(false);
                setForwardMessage(null);
                setForwardMessages([]);
                setSelectedForwardContacts([]);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h2 className="text-xl font-bold mb-2 pr-8 text-zinc-100">
              {forwardMessages.length > 1
                ? `Forward ${forwardMessages.length} Messages`
                : "Forward Message"}
            </h2>
            
            {/* Message preview snippet */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 mb-4 text-zinc-400 text-xs max-w-full max-h-32 overflow-y-auto">
              <span className="font-bold text-zinc-300 block mb-1">Preview:</span>
              {forwardMessages.length > 1 ? (
                <ul className="space-y-1">
                  {forwardMessages.map((m, i) => (
                    <li key={m.id} className="truncate">
                      {i + 1}. {m.type === "image" ? "📷 Photo" :
                        m.type === "audio" || m.type === "voice" ? "🎵 Voice Note" :
                        m.type === "video" ? "🎥 Video" :
                        m.type === "document" ? `📄 ${m.fileName || "Document"}` :
                        m.type === "location" ? "📍 Location" :
                        m.text || "Message"}
                    </li>
                  ))}
                </ul>
              ) : forwardMessage ? (
                forwardMessage.type === "image" ? "📷 Image Attachment" :
                forwardMessage.type === "audio" || forwardMessage.type === "voice" ? "🎵 Voice Note" :
                forwardMessage.type === "video" ? "🎥 Video Attachment" :
                forwardMessage.type === "document" ? `📄 Document: ${forwardMessage.fileName}` :
                forwardMessage.type === "location" ? "📍 Location Share" :
                forwardMessage.text || ""
              ) : null}
            </div>

            <input
              type="text"
              placeholder="Search contacts..."
              value={forwardSearchQuery}
              onChange={(e) => setForwardSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 mb-4 shrink-0"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {contacts
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()) ||
                    c.phone.includes(forwardSearchQuery)
                )
                .map((c) => {
                  const isChecked = selectedForwardContacts.includes(c.phone);
                  return (
                    <div
                      key={c.phone}
                      onClick={() => {
                        setSelectedForwardContacts(prev =>
                          isChecked ? prev.filter(p => p !== c.phone) : [...prev, c.phone]
                        );
                      }}
                      className="w-full text-left flex justify-between items-center px-4 py-3 bg-zinc-950/40 hover:bg-zinc-800/30 border border-zinc-800/40 rounded-2xl transition-all cursor-pointer select-none"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">{c.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">+{c.phone}</div>
                      </div>
                      <div className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all ${
                        isChecked 
                          ? "bg-emerald-500 border-emerald-500 text-zinc-955" 
                          : "border-zinc-700 bg-zinc-900 text-transparent"
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              {contacts.filter(
                (c) =>
                  c.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()) ||
                  c.phone.includes(forwardSearchQuery)
              ).length === 0 && (
                <p className="text-center text-zinc-500 text-xs py-8">No contacts found.</p>
              )}
            </div>

            <button
              onClick={handleForward}
              disabled={isForwarding || selectedForwardContacts.length === 0}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed active:scale-95 text-zinc-955 font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>
                {isForwarding
                  ? "Forwarding..."
                  : forwardMessages.length > 1
                    ? `Forward ${forwardMessages.length} msgs to ${selectedForwardContacts.length} contact${selectedForwardContacts.length === 1 ? "" : "s"}`
                    : `Forward to ${selectedForwardContacts.length} contact${selectedForwardContacts.length === 1 ? "" : "s"}`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
