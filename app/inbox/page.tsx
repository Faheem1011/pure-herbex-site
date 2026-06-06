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
  avatarUrl?: string;
}

const ACCESS_PASSWORD = "PureHerbex2026!";
const getEpochTime = () => Math.floor(Date.now() / 1000);

const TAGS = [
  { id: "Confirm", label: "Confirm", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { id: "Potential", label: "Potential Client", color: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "Important", label: "Important", color: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "Spam", label: "Spam", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" }
];

export default function InboxPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("inbox_password") === ACCESS_PASSWORD;
    }
    return false;
  });
  const [loginError, setLoginError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "Confirm" | "Potential" | "Important" | "Spam" | "archived">("all");
  
  // Forwarding feature states
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardSearchQuery, setForwardSearchQuery] = useState("");
  const [selectedForwardContacts, setSelectedForwardContacts] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Media & Location features
  const [directoryContacts, setDirectoryContacts] = useState<{ name: string; phone: string }[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<"directory" | "custom">("directory");
  const [dirSearchQuery, setDirSearchQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");

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
  }, [activeChat]);

  // Android back button integration
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).handleAndroidBack = () => {
        setActiveChat(null);
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

  // Click outside listener to close custom message context menus
  useEffect(() => {
    const handleWindowClick = () => {
      setActiveMenuMessageId(null);
    };
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  // Native MediaRecorder-based voice recording (OGG/OPUS — WhatsApp standard)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer OGG/OPUS (WhatsApp voice note format), fall back to WebM
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg; codecs=opus")
        ? "audio/ogg; codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm; codecs=opus")
        ? "audio/webm; codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100); // collect chunks every 100ms
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert("Could not access microphone. Please allow microphone access and try again.");
      console.error(err);
    }
  };

  const stopAndSendRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;

    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

    recorder.onstop = async () => {
      // Stop all microphone tracks to release the mic
      recorder.stream.getTracks().forEach((t) => t.stop());

      const mimeType = recorder.mimeType || "audio/ogg";
      const isOgg = mimeType.includes("ogg");
      
      // WhatsApp accepts: audio/ogg, audio/mp4, audio/aac, audio/mpeg, audio/amr
      // WebM is NOT accepted. If WebM was recorded, we map its MIME type to audio/ogg 
      // or audio/mp4 so Meta's validation passes.
      const fileType = isOgg ? "audio/ogg" : "audio/mp4";
      const ext = isOgg ? "ogg" : "m4a";

      const audioBlob = new Blob(audioChunksRef.current, { type: fileType });
      const file = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, {
        type: fileType,
        lastModified: Date.now(),
      });

      setSending(true);
      try {
        const mediaId = await uploadFile(file);
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ACCESS_PASSWORD}`,
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
    };

    recorder.stop();
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop());
    };
    recorder.stop();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleForward = async () => {
    if (!forwardMessage || selectedForwardContacts.length === 0) return;
    setIsForwarding(true);
    try {
      for (const phone of selectedForwardContacts) {
        const targetContact = contacts.find(c => c.phone === phone);
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ACCESS_PASSWORD}`,
          },
          body: JSON.stringify({
            toPhone: phone,
            replyText: forwardMessage.type === "text" || !forwardMessage.type ? forwardMessage.text : undefined,
            contactName: targetContact?.name || "WhatsApp Contact",
            type: forwardMessage.type || "text",
            mediaId: forwardMessage.mediaId || undefined,
            fileName: forwardMessage.fileName || undefined,
            location: forwardMessage.location || undefined,
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
                  text: forwardMessage.text,
                  timestamp: getEpochTime(),
                  status: "sent",
                  type: forwardMessage.type || "text",
                  mediaId: forwardMessage.mediaId || undefined,
                  fileName: forwardMessage.fileName || undefined,
                  location: forwardMessage.location || undefined,
                };
                return {
                  ...c,
                  messages: [...c.messages, newMsg],
                };
              }
              return c;
            });
          });
        }
      }
      setIsForwardModalOpen(false);
      setForwardMessage(null);
      setSelectedForwardContacts([]);
      alert("Message forwarded successfully!");
    } catch (err: any) {
      alert("Error forwarding message: " + err.message);
    } finally {
      setIsForwarding(false);
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

  // Fetch messages with polling
  const fetchChats = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/messages", {
        headers: {
          Authorization: `Bearer ${ACCESS_PASSWORD}`,
        },
      });
      const data = await res.json();
      if (data.contacts) {
        // Sort contacts by latest message
        const sorted = data.contacts.sort((a: Contact, b: Contact) => {
          const timeA = a.messages[a.messages.length - 1]?.timestamp || 0;
          const timeB = b.messages[b.messages.length - 1]?.timestamp || 0;
          return timeB - timeA;
        });

        // Preserve any newly started empty chats that haven't received a message yet
        setContacts((prev) => {
          const emptyChats = prev.filter(
            (p) => p.messages.length === 0 && !sorted.some((s: Contact) => s.phone === p.phone)
          );
          
          // Re-apply any tags present in state to the incoming data (in case tag write is pending)
          const merged = [...emptyChats, ...sorted].map((c) => {
            const localContact = prev.find((p) => p.phone === c.phone);
            if (localContact?.tag && !c.tag) {
              c.tag = localContact.tag;
            }
            return c;
          });
          return merged;
        });

        // Update active chat history if open
        const currentActive = activeChatRef.current;
        if (currentActive) {
          const updatedActive = sorted.find((c: Contact) => c.phone === currentActive.phone);
          if (updatedActive) {
            setActiveChat(updatedActive);
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

  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setTimeout(() => {
      fetchChats(true);
    }, 0);
    const interval = setInterval(() => fetchChats(true), 5000); // Poll every 5 seconds
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem("inbox_password", password);
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  };

  // Upload attachment file to API
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/media", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_PASSWORD}`,
      },
      body: formData,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (text.includes("Payload Too Large") || res.status === 413) {
        throw new Error("File exceeds Vercel's 4.5MB serverless upload limit. Please use a compressed or smaller file.");
      }
      throw new Error(text || "Failed to upload file");
    }

    if (!res.ok) {
      throw new Error(data.error || "Failed to upload file to WhatsApp Media server");
    }
    return data.mediaId;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || sending) return;

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

        if (fileToUpload && fileToUpload.size > 4.5 * 1024 * 1024) {
          alert(`File is too large (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB). Vercel has a 4.5MB serverless upload limit. Please compress your file or choose a smaller one.`);
          setSending(false);
          return;
        }

        if (fileToUpload) {
          mediaId = await uploadFile(fileToUpload);
        }
        msgType = pendingFileType || "document";
      } else if (pendingLocation) {
        msgType = "location";
      }

      // 2. Dispatch message
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_PASSWORD}`,
        },
        body: JSON.stringify({
          toPhone: activeChat.phone,
          replyText: msgType === "text" ? replyText : undefined,
          contactName: activeChat.name,
          type: msgType,
          mediaId: mediaId || undefined,
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

      const res = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_PASSWORD}`,
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

      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_PASSWORD}`,
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

      const res = await fetch("/api/messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_PASSWORD}`,
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
    sessionStorage.removeItem("inbox_password");
    setIsLoggedIn(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio" | "video" | "document") => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setPendingFileType(type);
      setPendingLocation(null); // Clear location
      setShowAttachMenu(false);
    }
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
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    
    if (activeTab === "archived") {
      return matchesSearch && c.archived;
    }
    
    // Hide archived chats from standard tabs
    if (c.archived) return false;
    
    const matchesTab = activeTab === "all" ? true : c.tag === activeTab;
    return matchesSearch && matchesTab;
  });

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-4 border border-emerald-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
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
    <div className="bg-zinc-950 text-zinc-200 min-h-screen flex h-screen overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR: Navigation / Utility Icons (Linear style) */}
      <aside className="hidden md:flex w-16 bg-zinc-900 border-r border-zinc-800/80 flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center space-y-8 w-full">
          {/* Logo Brand */}
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 font-black text-sm shadow-lg shadow-emerald-500/5 cursor-pointer">
            PH
          </div>
          {/* Navigation Links */}
          <nav className="flex flex-col items-center space-y-4 w-full">
            <button
              onClick={() => setActiveTab("all")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "all"
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
                onClick={() => setActiveTab(tag.id as any)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === tag.id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title={`Filter: ${tag.label}`}
              >
                <span className={`w-2 h-2 rounded-full ${tag.color}`}></span>
              </button>
            ))}

            <button
              onClick={() => setActiveTab("archived")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === "archived"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
              title="Archived Chats"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center space-y-4">
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

      {/* 2. MIDDLE COLUMN: Conversation Lists (Sleek List View) */}
      <section className={`w-full md:w-80 bg-zinc-900/40 border-r border-zinc-800/80 flex flex-col overflow-hidden shrink-0 ${activeChat ? "hidden md:flex" : "flex"}`}>
        
        {/* Header Section */}
        <div className="p-5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Inbox</h1>
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
        </div>
        
        {/* Chats list */}
        <div className="flex-1 overflow-y-auto space-y-1 p-3 pb-20 md:pb-3">
          {filteredContacts.length === 0 ? (
            <div className="text-center text-zinc-600 text-sm mt-12 px-4">
              <svg className="w-8 h-8 mx-auto text-zinc-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p>No chats found in this category.</p>
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
                  onClick={() => setActiveChat(c)}
                  className={`group w-full text-left flex items-start space-x-3 px-4 py-3.5 rounded-2xl transition-all border cursor-pointer relative ${
                    isActive
                      ? "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-sm"
                      : "border-transparent hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm truncate text-zinc-200">
                        {c.name}
                      </h3>
                      <span className="text-[10px] text-zinc-500 ml-1 shrink-0 group-hover:opacity-0 transition-opacity duration-200">
                        {latestTime}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-1 leading-normal pr-8">{latestText}</p>
                    
                    {/* Render color tag pills in list */}
                    {contactTag && (
                      <span className={`inline-flex items-center px-2 py-0.5 mt-2 rounded-md text-[9px] font-semibold border ${contactTag.text} ${contactTag.border} ${contactTag.bg}`}>
                        {contactTag.label}
                      </span>
                    )}
                  </div>

                  {/* Hover Actions Panel */}
                  <div 
                    className="absolute right-4 top-3.5 hidden md:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
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
      <main className={`flex-1 flex flex-col bg-zinc-950 overflow-hidden relative ${activeChat ? "flex" : "hidden md:flex"}`}>
        {activeChat ? (
          <>
            {/* Chat Info Header */}
            <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between shrink-0 backdrop-blur-md">
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

              {/* Header Actions & Tags Selector */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 border-r border-zinc-800/80 pr-3">
                  <button
                    onClick={() => archiveContact(activeChat.phone, !activeChat.archived)}
                    className="p-2 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all flex items-center space-x-1.5 text-xs font-semibold"
                    title={activeChat.archived ? "Unarchive Chat" : "Archive Chat"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {activeChat.archived ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      )}
                    </svg>
                    <span>{activeChat.archived ? "Unarchive" : "Archive"}</span>
                  </button>
                  <button
                    onClick={() => deleteContact(activeChat.phone)}
                    className="p-2 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/40 rounded-xl text-zinc-500 hover:text-rose-400 transition-all flex items-center space-x-1.5 text-xs font-semibold"
                    title="Delete Chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mr-1">Tag As:</label>
                  <select
                    value={activeChat.tag || ""}
                    onChange={(e) => updateContactTag(activeChat.phone, (e.target.value as any) || null)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="">No Tag</option>
                    {TAGS.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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

                  // Render different bubble contents depending on message type
                  const renderBubbleContent = () => {
                    const type = msg.type || "text";
                    
                    if (type === "image") {
                      return (
                        <div className="space-y-2">
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
                        <div className="pt-1 min-w-[240px]">
                          <audio
                            controls
                            src={`/api/media?id=${msg.mediaId}`}
                            className="w-full h-10 mt-1 focus:outline-none"
                          />
                        </div>
                      );
                    }

                    if (type === "video") {
                      return (
                        <div className="space-y-2">
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
                      );
                    }

                    if (type === "location" && msg.location) {
                      return (
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
                      );
                    }

                    return <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.text}</p>;
                  };

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuMessageId(msg.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                        }}
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm relative cursor-pointer select-none ${
                          isMe
                            ? "bg-emerald-500 text-zinc-955 font-medium rounded-tr-none shadow-md shadow-emerald-500/10"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-md"
                        }`}
                      >
                        {renderBubbleContent()}
                        
                        <div
                          className={`flex items-center justify-end space-x-1 mt-1.5 text-[9px] ${
                            isMe ? "text-zinc-800/80" : "text-zinc-500"
                          }`}
                        >
                          <span>{msgTime}</span>
                          {isMe && (
                            <span className="capitalize font-semibold">({msg.status || "sent"})</span>
                          )}
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
                                setForwardMessage(msg);
                                setSelectedForwardContacts([]);
                                setIsForwardModalOpen(true);
                                setActiveMenuMessageId(null);
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-t-xl text-xs font-semibold flex items-center space-x-2 border-b border-zinc-800/50"
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
                                className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-b-xl text-xs font-semibold flex items-center space-x-2"
                              >
                                <span>📋</span>
                                <span>Copy Text</span>
                              </button>
                            )}
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
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10 shrink-0 relative">
              
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
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 border border-zinc-800/80 hover:bg-zinc-900 active:scale-95 ${
                      showAttachMenu ? "bg-zinc-900 border-zinc-700 text-emerald-400" : "bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <svg className="w-6 h-6 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={pendingFile ? "Add an optional caption..." : "Type a message..."}
                    autoComplete="off"
                    className="flex-1 px-5 py-3.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  />
                  
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 border border-zinc-800/80 hover:bg-zinc-900 active:scale-95 bg-zinc-900/40 text-zinc-400 hover:text-emerald-400"
                    title="Record Voice Note"
                  >
                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-955 font-bold rounded-xl text-sm transition-all flex items-center justify-center disabled:opacity-55 animate-fade-in"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
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

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!activeChat && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800/80 flex items-center justify-around z-40 px-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "all" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.586-3.586a2 2 0 00-2.828 0L16 11m-8 3V4"/>
            </svg>
            <span className="text-[9px] font-bold">All</span>
          </button>

          {TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTab(tag.id as any)}
              className={`flex flex-col items-center justify-center space-y-1 ${
                activeTab === tag.id ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${tag.color}`}></span>
              <span className="text-[9px] font-bold">{tag.label.split(" ")[0]}</span>
            </button>
          ))}

          <button
            onClick={() => setActiveTab("archived")}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeTab === "archived" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-[9px] font-bold">Archived</span>
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
