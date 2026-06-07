"use client";

import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: number;
  status?: string;
  type?: string; // "text" | "image" | "audio" | "voice" | "video" | "document" | "location"
  mediaId?: string;
  fileName?: string;
  replyTo?: string; // ID of the message being replied to
  isDeleted?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

interface Contact {
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

type StatusItem = {
  id: string;
  type: "image" | "video";
  mediaId: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
};

// Custom Audio Player Component
function CustomAudioPlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const t = parseFloat(e.target.value);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s) || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 py-2 px-2.5 rounded-2xl w-full max-w-[min(100%,240px)] min-w-0 ${
      isMe
        ? "bg-emerald-600/30 border border-emerald-400/20"
        : "bg-zinc-800/60 border border-zinc-700/40"
    }`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
      />
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90 ${
          isMe
            ? "bg-zinc-950 text-emerald-400 hover:bg-zinc-900"
            : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        }`}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      {/* Progress */}
      <div className="flex-1 min-w-0">
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: isMe ? "rgba(52,211,153,0.2)" : "rgba(63,63,70,0.8)" }}>
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${ isMe ? "bg-emerald-400" : "bg-emerald-500" }`}
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className={`flex justify-between mt-1 text-[9px] font-semibold ${ isMe ? "text-emerald-200/70" : "text-zinc-400" }`}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      {/* Waveform decoration (static bars) */}
      <div className={`flex items-center gap-[2px] ${ isMe ? "text-emerald-300/60" : "text-zinc-400/60" }`}>
        {[3, 6, 4, 7, 3, 5, 4].map((h, i) => (
          <span
            key={i}
            className={`w-[2px] rounded-full bg-current ${ isPlaying ? "animate-pulse" : "" }`}
            style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

const getEpochTime = () => Math.floor(Date.now() / 1000);
const MARKETING_TEMPLATE = "herbex_marketing";

function parseLeadName(fullName: string): { name: string; city: string } {
  const match = fullName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { name: match[1].trim(), city: match[2].trim() };
  return { name: fullName.trim(), city: "" };
}

const TAGS = [
  { id: "Confirm", label: "Confirm", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { id: "Potential", label: "Potential Client", color: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "Important", label: "Important", color: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "Spam", label: "Spam", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" }
];

export default function InboxPage() {
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
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mp3Recorder, setMp3Recorder] = useState<any>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Media & Location features
  const [directoryContacts, setDirectoryContacts] = useState<{ name: string; phone: string }[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<"directory" | "custom">("directory");
  const [dirSearchQuery, setDirSearchQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");

  // Marketing CRM states
  const [viewMode, setViewMode] = useState<"inbox" | "promo" | "campaign" | "status">("inbox");
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

  // Android back button integration
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).handleAndroidBack = () => {
        if (activeCampaignChatRef.current) setActiveCampaignChat(null);
        else setActiveChat(null);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).handleAndroidBack;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const android = (window as any).Android;
      if (android && typeof android.setChatOpen === "function") {
        android.setChatOpen(activeChat !== null);
      }
    }
  }, [activeChat]);

  // Keep phone screen awake while inbox is unlocked (Android app)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const android = (window as any).Android;
    if (android && typeof android.setKeepScreenOn === "function") {
      android.setKeepScreenOn(isLoggedIn);
    }
  }, [isLoggedIn]);

  const restoreSession = async (token: string) => {
    try {
      const res = await fetch("/api/messages/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.setItem("inbox_password", token);
        setSessionToken(token);
        setIsLoggedIn(true);
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

  // Load mic-recorder-to-mp3 module but create a FRESH instance per recording
  const startRecording = async () => {
    try {
      const android = (window as any).Android;
      if (android?.requestMicrophonePermission && !android.requestMicrophonePermission()) {
        alert("Microphone permission required. Allow it when prompted, then tap the mic again.");
        return;
      }

      const MicRecorderModule = await import("mic-recorder-to-mp3");
      const freshRecorder = new MicRecorderModule.default({ bitRate: 128 });
      setMp3Recorder(freshRecorder);
      await freshRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      const android = (window as any).Android;
      const settingsHint = android?.openAppSettings
        ? "\n\nIf blocked, open App Settings and enable Microphone."
        : "";
      alert("Could not access microphone. Please allow microphone access." + settingsHint);
      console.error(err);
    }
  };

  const stopAndSendRecording = () => {
    if (mp3Recorder && isRecording) {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      mp3Recorder
        .stop()
        .getMp3()
        .then(async ([buffer, blob]: [any, any]) => {
          // Construct the File object using the actual binary Blob instead of the buffer array.
          // This creates a valid, playable MP3 file.
          const file = new File([blob], `voice-note-${Date.now()}.mp3`, {
            type: "audio/mpeg",
            lastModified: Date.now(),
          });

          setSending(true);
          try {
            const mediaId = await uploadFile(file);
            const res = await fetch("/api/messages/", {
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
                type: "audio",
                mediaId: mediaId,
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
          } finally {
            setSending(false);
          }
        })
        .catch((e: any) => {
          alert("Error processing MP3: " + e.message);
          console.error(e);
        });
    }
  };

  const cancelRecording = () => {
    if (mp3Recorder && isRecording) {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      try {
        mp3Recorder.stop();
      } catch (e) {}
      alert("Voice recording cancelled.");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Multi-select handlers
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
        await fetch("/api/messages/", {
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
      .filter(m => selectedMessageIds.has(m.id))
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
    setSelectedMessageIds(new Set(activeChat.messages.map(m => m.id)));
  };

  const handleForward = async () => {
    const messagesToForward = forwardMessage ? [forwardMessage] : forwardMessages;
    if (messagesToForward.length === 0 || selectedForwardContacts.length === 0) return;
    
    setIsForwarding(true);
    try {
      for (const phone of selectedForwardContacts) {
        const targetContact = contacts.find(c => c.phone === phone);
        for (const msg of messagesToForward) {
          const res = await fetch("/api/messages/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              toPhone: phone,
              replyText: msg.type === "text" || !msg.type ? msg.text : undefined,
              contactName: targetContact?.name || "WhatsApp Contact",
              type: msg.type || "text",
              mediaId: msg.mediaId || undefined,
              fileName: msg.fileName || undefined,
              location: msg.location || undefined,
            }),
          });

          if (res.ok) {
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
                    type: msg.type || "text",
                    mediaId: msg.mediaId || undefined,
                    fileName: msg.fileName || undefined,
                    location: msg.location || undefined,
                  };
                  return { ...c, messages: [...c.messages, newMsg] };
                }
                return c;
              });
            });
          }
        }
      }
      setIsForwardModalOpen(false);
      setForwardMessage(null);
      setForwardMessages([]);
      setSelectedForwardContacts([]);
      alert("Messages forwarded successfully!");
    } catch (err: any) {
      alert("Error forwarding message: " + err.message);
    } finally {
      setIsForwarding(false);
    }
  };

  // Mark a chat as read (clear unread indicators)
  const markChatRead = async (phone: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.phone === phone ? { ...c, hasUnread: false, unreadCount: 0 } : c
      )
    );
    try {
      await fetch("/api/messages/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, markRead: true }),
      });
    } catch (e) {}
  };

  const handleMessageLongPress = (id: string) => {
    if (isSelectMode) {
      toggleMessageSelection(id);
    } else {
      setActiveMenuMessageId(id);
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
      const res = await fetch("/api/campaign/", {
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
      const res = await fetch("/api/campaign/", {
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
      const res = await fetch("/api/campaign/", {
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
      await fetch("/api/campaign/", {
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

  // Fetch messages with polling
  const fetchChats = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/messages/", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await res.json();
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
              return { ...c, hasUnread: false, unreadCount: 0 };
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
            setActiveChat({ ...updatedActive, hasUnread: false, unreadCount: 0 });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      if (!silent) {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };


  const fetchCampaignChats = async (silent = false) => {
    try {
      const res = await fetch("/api/marketing-messages/", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (!data.contacts) return;

      const prevContacts = campaignContactsRef.current;
      data.contacts.forEach((newContact: Contact) => {
        const oldContact = prevContacts.find((c) => c.phone === newContact.phone);
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

      const sorted = data.contacts.sort((a: Contact, b: Contact) => {
        const timeA = a.messages?.[a.messages.length - 1]?.timestamp || 0;
        const timeB = b.messages?.[b.messages.length - 1]?.timestamp || 0;
        return timeB - timeA;
      });

      setCampaignContacts(sorted);

      const currentActive = activeCampaignChatRef.current;
      if (currentActive) {
        const updated = sorted.find((c: Contact) => c.phone === currentActive.phone);
        if (updated) {
          setActiveCampaignChat({ ...updated, hasUnread: false, unreadCount: 0 });
        }
      }
    } catch (err) {
      console.error("Failed to load campaign conversations", err);
    }
  };

  const markCampaignChatRead = async (phone: string) => {
    setCampaignContacts((prev) =>
      prev.map((c) => (c.phone === phone ? { ...c, hasUnread: false, unreadCount: 0 } : c))
    );
    try {
      await fetch("/api/marketing-messages/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, markRead: true }),
      });
    } catch (e) {}
  };

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
      await fetch("/api/marketing-messages/", {
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
    const timer = setTimeout(() => {
      fetchChats(true);
      fetchCampaignChats(true);
    }, 0);
    const interval = setInterval(() => {
      fetchChats(true);
      fetchCampaignChats(true);
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isLoggedIn]);

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

  // Upload attachment file to API
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

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
          throw new Error("File exceeds serverless upload limits. Please use a compressed or smaller file.");
        }
        throw new Error(text || "Failed to upload file");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file to WhatsApp Media server");
      }
      return data.mediaId;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error("Upload timed out. The file might be too large for your current connection or the server is busy.");
      }
      throw err;
    }
  };

  const handleCampaignSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaignChat || sending || !replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/marketing-messages/", {
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

      // 1. Handle file upload & optional compression
      if (pendingFile) {
        if (pendingFileType === "image" && pendingFile.size > 4 * 1024 * 1024) {
          fileToUpload = await compressImage(pendingFile);
        }

        if (fileToUpload) {
          mediaId = await uploadFile(fileToUpload);
        }
        msgType = pendingFileType || "document";
      } else if (pendingLocation) {
        msgType = "location";
      }

      // 2. Dispatch message
      const res = await fetch("/api/messages/", {
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
          fileName: fileToUpload ? fileToUpload.name : undefined,
          location: pendingLocation ? {
            latitude: parseFloat(pendingLocation.latitude),
            longitude: parseFloat(pendingLocation.longitude),
            name: pendingLocation.name,
            address: pendingLocation.address,
          } : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        // Format display text for optimistic update
        let displayLogText = replyText || "";
        if (msgType === "image") displayLogText = "📷 Photo";
        else if (msgType === "audio") displayLogText = "🎵 Audio/Voice Note";
        else if (msgType === "video") displayLogText = "🎥 Video";
        else if (msgType === "document") displayLogText = fileToUpload ? `📄 File: ${fileToUpload.name}` : "📄 File";
        else if (msgType === "location") displayLogText = pendingLocation?.name ? `📍 Location: ${pendingLocation.name}` : "📍 Location";

        const newMsg: Message = {
          id: data.msgId,
          sender: "me",
          text: displayLogText,
          timestamp: getEpochTime(),
          status: "sent",
          type: msgType,
          mediaId: mediaId || undefined,
          replyTo: replyingTo?.id || undefined,
          fileName: fileToUpload ? fileToUpload.name : undefined,
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
  const updateContactTag = async (phone: string, tag: "Confirm" | "Potential" | "Important" | "Spam" | null) => {
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
      await fetch("/api/messages/", {
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
      const mediaId = await uploadFile(file);
      const type = file.type.startsWith("video/") ? "video" : "image";
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
      const link = data.statusPageUrl || `${window.location.origin}/status/`;
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

      const res = await fetch("/api/messages/", {
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

      const res = await fetch("/api/messages/", {
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
      await fetch("/api/messages/", {
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
        alert("Video file is too large. WhatsApp limits videos to 16MB. Please choose a smaller or compressed video.");
        return;
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

  const COMMON_EMOJIS = ["😀", "😂", "😍", "😊", "🙏", "👍", "🔥", "✨", "💯", "✅", "📍", "📞", "🌿", "💊", "💪", "❤️"];

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

  // Render different bubble contents depending on message type
  const renderMessageContent = (msg: Message, isMe: boolean) => {
    if (msg.isDeleted) {
      return <p className="italic text-zinc-500 text-xs">🚫 This message was deleted</p>;
    }

    const type = msg.type || "text";

    // Quoted message preview
    const renderQuotedMessage = () => {
      if (!msg.replyTo) return null;
      const quotedMsg = activeChat?.messages.find(m => m.id === msg.replyTo);
      if (!quotedMsg) return null;

      return (
        <div className={`mb-2 p-2 rounded-lg border-l-4 text-xs truncate max-w-full bg-black/20 ${
          isMe ? "border-emerald-400 text-emerald-100" : "border-emerald-500 text-zinc-300"
        }`}>
          <div className="font-bold text-[10px] mb-0.5">
            {quotedMsg.sender === "me" ? "You" : activeChat?.name}
          </div>
          <div className="truncate opacity-80">
            {quotedMsg.isDeleted ? "🚫 Deleted" : 
             quotedMsg.type === "image" ? "📷 Photo" :
             quotedMsg.type === "audio" || quotedMsg.type === "voice" ? "🎵 Voice Note" :
             quotedMsg.text}
          </div>
        </div>
      );
    };
    
    if (type === "image") {
      return (
        <div className="space-y-2">
          {renderQuotedMessage()}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media?id=${msg.mediaId}`}
            alt="WhatsApp attachment"
            className="max-w-full max-h-72 rounded-xl object-contain border border-zinc-800 bg-zinc-950 mt-1 cursor-pointer hover:opacity-90"
            onClick={() => window.open(`/api/media?id=${msg.mediaId}`, "_blank")}
          />
          {msg.text && msg.text !== "📷 Photo" && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
          )}
        </div>
      );
    }
    
    if (type === "audio" || type === "voice") {
      return (
        <div className="pt-0.5">
          {renderQuotedMessage()}
          <CustomAudioPlayer
            src={`/api/media?id=${msg.mediaId}`}
            isMe={isMe}
          />
        </div>
      );
    }

    if (type === "video") {
      return (
        <div className="space-y-2">
          {renderQuotedMessage()}
          <video
            controls
            src={`/api/media?id=${msg.mediaId}`}
            className="max-w-full max-h-72 rounded-xl border border-zinc-800 bg-zinc-950 mt-1"
          />
          {msg.text && msg.text !== "🎥 Video" && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
          )}
        </div>
      );
    }

    if (type === "document") {
      return (
        <div className="space-y-2">
          {renderQuotedMessage()}
          <a
            href={`/api/media?id=${msg.mediaId}`}
            download={msg.fileName || "document"}
            className="flex items-center space-x-3 p-3 bg-zinc-950/40 rounded-xl border border-zinc-850 hover:bg-zinc-950/70 transition-all text-zinc-100 no-underline mt-1"
          >
            <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs block truncate text-zinc-200">{msg.fileName || "Document"}</span>
              <span className="text-[9px] text-zinc-500 block">Download Attachment</span>
            </div>
          </a>
        </div>
      );
    }

    if (type === "location" && msg.location) {
      return (
        <div className="space-y-2">
          {renderQuotedMessage()}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${msg.location.latitude},${msg.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 bg-zinc-950/40 rounded-xl border border-zinc-850 hover:bg-zinc-950/70 transition-all text-zinc-100 no-underline mt-1"
          >
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs block truncate text-zinc-200">{msg.location.name || "Shared Location"}</span>
              {msg.location.address && (
                <span className="text-[9px] text-zinc-500 block truncate">{msg.location.address}</span>
              )}
              <span className="text-[9px] text-emerald-400 block mt-0.5 font-bold">Open in Google Maps</span>
            </div>
          </a>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {renderQuotedMessage()}
        <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.text}</p>
      </div>
    );
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Pure Herbex Inbox</h1>
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
    <div className="bg-zinc-950 text-zinc-200 min-h-screen flex h-screen overflow-hidden font-sans fixed inset-0">
      
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

      {viewMode === "status" ? (
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          <div className="p-5 border-b border-zinc-800/60 shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Status</h1>
            <p className="text-xs text-zinc-500 mt-1">Upload images or videos for your public status page (separate from Promo marketing).</p>
            <a href="/status/" target="_blank" className="text-xs text-emerald-400 hover:underline mt-1 inline-block">Open status page →</a>
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
                  const link = `${window.location.origin}/status/`;
                  navigator.clipboard.writeText(link);
                  alert("Status link copied! Share it with customers on WhatsApp manually.");
                }}
                className="w-full py-2.5 mb-3 border border-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-xl text-sm font-semibold"
              >
                Copy status page link
              </button>
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
                        <img src={`/api/media/?id=${item.mediaId}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={`/api/media/?id=${item.mediaId}`} className="w-full h-full object-cover" muted />
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
            <div className="p-5 border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-100">Promo</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Send template: {MARKETING_TEMPLATE}</p>
                </div>
                <button
                  onClick={fetchCampaignStatus}
                  className="w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-zinc-200"
                  title="Refresh status"
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
            <div className="p-5 border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-amber-400">Campaign Inbox</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">Marketing sends &amp; replies only</p>
                </div>
                <button
                  onClick={() => fetchCampaignChats(false)}
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
                  const latestText = latestMsg?.text || "No messages";
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
                <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-3 pb-2.5 pt-[max(2.75rem,env(safe-area-inset-top,0px))] md:px-6 md:py-4 flex items-center justify-between shrink-0">
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

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {activeCampaignChat.messages.map((msg) => {
                    const isMe = msg.sender === "me";
                    const msgTime = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          isMe
                            ? "bg-amber-500 text-zinc-950 font-medium rounded-tr-none"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                        }`}>
                          {renderMessageContent(msg, isMe)}
                          <div className={`text-[9px] mt-1 text-right ${isMe ? "text-amber-950/70" : "text-zinc-500"}`}>{msgTime}</div>
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
        <div className="p-5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">{inboxTitle}</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchChats(false)}
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
              const latestText = latestMsg?.text || "(New Conversation)";
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
                  onClick={() => { setActiveChat(c); if (c.hasUnread && !c.blocked) markChatRead(c.phone); }}
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
            <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-3 pb-2.5 pt-[max(2.75rem,env(safe-area-inset-top,0px))] md:px-6 md:py-4 md:pt-4 flex items-center justify-between shrink-0 backdrop-blur-md relative z-40">
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
                    {activeChat.hasUnread && (
                      <button
                        onClick={() => markChatRead(activeChat.phone)}
                        className="p-2 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
                        title="Mark as read"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    )}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
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
                  const msgTime = new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} items-center space-x-2`}
                    >
                      {isSelectMode && (
                        <div 
                          onClick={() => toggleMessageSelection(msg.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                            selectedMessageIds.has(msg.id)
                              ? "bg-emerald-500 border-emerald-500 text-zinc-955"
                              : "border-zinc-700 hover:border-emerald-500"
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
                            longPressTimerRef.current = setTimeout(() => handleMessageLongPress(msg.id), 600);
                          }
                        }}
                        onMouseUp={() => {
                          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                        }}
                        onTouchStart={() => {
                          if (!isSelectMode) {
                            longPressTimerRef.current = setTimeout(() => handleMessageLongPress(msg.id), 600);
                          }
                        }}
                        onTouchEnd={() => {
                          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelectMode) {
                            toggleMessageSelection(msg.id);
                          } else {
                            setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                          }
                        }}
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm relative cursor-pointer select-none transition-all ${
                          selectedMessageIds.has(msg.id) ? "scale-[0.98] opacity-80 border-emerald-500 ring-2 ring-emerald-500/20" : ""
                        } ${
                          isMe
                            ? "bg-emerald-500 text-zinc-955 font-medium rounded-tr-none shadow-md shadow-emerald-500/10"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-md"
                        }`}
                      >
                        {renderMessageContent(msg, isMe)}
                        
                        <div
                          className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                            isMe ? "text-emerald-950/70" : "text-zinc-500"
                          }`}
                        >
                          <span>{msgTime}</span>
                          {isMe && (() => {
                            const s = msg.status || "sent";
                            if (s === "failed") return (
                              <span className="text-rose-500" title="Failed">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                              </span>
                            );
                            if (s === "read") return (
                              <span className="text-emerald-400" title="Read">
                                <svg className="w-4 h-3 fill-current" viewBox="0 0 24 16"><path d="M0 8.5L5.5 14 18 1.5 16.5 0 5.5 11 1.5 7z"/><path d="M6 8.5L11.5 14 24 1.5 22.5 0 11.5 11 7.5 7z" opacity="0.5"/></svg>
                              </span>
                            );
                            if (s === "delivered") return (
                              <span className="text-zinc-800" title="Delivered">
                                <svg className="w-4 h-3 fill-current" viewBox="0 0 24 16"><path d="M0 8.5L5.5 14 18 1.5 16.5 0 5.5 11 1.5 7z"/><path d="M6 8.5L11.5 14 24 1.5 22.5 0 11.5 11 7.5 7z" opacity="0.5"/></svg>
                              </span>
                            );
                            // sent
                            return (
                              <span className="text-zinc-800" title="Sent">
                                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 16"><path d="M0 8.5L5.5 14 18 1.5 16.5 0 5.5 11 1.5 7z"/></svg>
                              </span>
                            );
                          })()}
                        </div>

                        {activeMenuMessageId === msg.id && (
                          <div 
                            className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl py-1 shadow-2xl z-50 w-36 text-zinc-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 text-xs font-semibold flex items-center space-x-2 border-b border-zinc-800/50"
                            >
                              <span>💬</span>
                              <span>Reply</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForwardMessage(msg);
                                setSelectedForwardContacts([]);
                                setIsForwardModalOpen(true);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 text-xs font-semibold flex items-center space-x-2 border-b border-zinc-800/50"
                            >
                              <span>➡️</span>
                              <span>Forward</span>
                            </button>
                            {msg.text && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(msg.text);
                                  setActiveMenuMessageId(null);
                                  alert("Copied to clipboard!");
                                }}
                                className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 text-xs font-semibold flex items-center space-x-2 border-b border-zinc-800/50"
                              >
                                <span>📋</span>
                                <span>Copy Text</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(msg.id);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-rose-900/40 text-rose-400 text-xs font-semibold flex items-center space-x-2 rounded-b-xl"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
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
            <div className="px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:p-4 border-t border-zinc-800/80 bg-zinc-900/10 shrink-0 relative">
              {activeChat.blocked ? (
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
                        fileInputRef.current.accept = "video/mp4";
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-zinc-800/80 rounded-xl text-zinc-300 hover:text-zinc-100 transition-all text-xs font-semibold"
                  >
                    <span className="text-emerald-400">🎥</span>
                    <span>Video</span>
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
                    <span className="text-zinc-300 text-sm font-semibold">Recording: {formatDuration(recordingDuration)}</span>
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
              { label: contactMenuTarget.pinned ? "Unpin chat" : "Pin chat", action: () => pinContact(contactMenuTarget.phone, !contactMenuTarget.pinned) },
              ...(contactMenuTarget.hasUnread ? [{ label: "Mark as read", action: () => markChatRead(contactMenuTarget.phone) }] : []),
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800/80 flex items-stretch justify-around z-40 px-1 safe-bottom">
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
              setViewMode("status");
              setActiveChat(null);
              fetchStatusItems();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0 ${
              viewMode === "status" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] font-bold">Status</span>
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
      {isForwardModalOpen && forwardMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => {
                setIsForwardModalOpen(false);
                setForwardMessage(null);
                setSelectedForwardContacts([]);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h2 className="text-xl font-bold mb-2 pr-8 text-zinc-100">Forward Message</h2>
            
            {/* Message preview snippet */}
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 mb-4 text-zinc-400 text-xs truncate max-w-full">
              <span className="font-bold text-zinc-300 block mb-1">Message Preview:</span>
              {forwardMessage.type === "image" ? "📷 Image Attachment" :
               forwardMessage.type === "audio" || forwardMessage.type === "voice" ? "🎵 Voice Note" :
               forwardMessage.type === "video" ? "🎥 Video Attachment" :
               forwardMessage.type === "document" ? `📄 Document: ${forwardMessage.fileName}` :
               forwardMessage.type === "location" ? "📍 Location Share" :
               forwardMessage.text || ""}
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
              <span>{isForwarding ? "Forwarding..." : `Forward to ${selectedForwardContacts.length} Contacts`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
