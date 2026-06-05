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
}

const ACCESS_PASSWORD = "PureHerbex2026!";

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
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchChats = async () => {
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
            return [...emptyChats, ...sorted];
          });

          // Update active chat history if open
          const currentActive = activeChatRef.current;
          if (currentActive) {
            const updatedActive = sorted.find((c: Contact) => c.phone === currentActive.phone);
            if (updatedActive) {
              setActiveChat((prevActive) => {
                // Keep the messages array sync'd but preserve empty chats that are now populated
                return updatedActive;
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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

          // Downscale if image is extremely large (standard Full HD constraint)
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

          // Export as JPEG with 0.8 quality
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
          // Compress large images client-side
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
          timestamp: Math.floor(Date.now() / 1000),
          status: "sent",
          type: msgType,
          mediaId: mediaId || undefined,
          fileName: pendingFile ? pendingFile.name : undefined,
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

  const handleLogout = () => {
    sessionStorage.removeItem("inbox_password");
    setIsLoggedIn(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio" | "video" | "document") => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setPendingFileType(type);
      setPendingLocation(null); // Clear location
      setShowAttachMenu(false);
    }
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

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-4 border border-emerald-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Pure Herbex Inbox</h1>
            <p className="text-slate-400 text-sm mt-1">Unlock WhatsApp conversations</p>
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
                className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-center text-lg tracking-widest"
              />
              <button
                type="submit"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-center"
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
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col h-screen overflow-hidden">
      
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 font-bold">
            PH
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Pure Herbex</h1>
            <span className="text-xs text-emerald-400 flex items-center mt-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
              WhatsApp Live Inbox
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
          >
            Lock Dashboard
          </button>
        </div>
      </header>

      {/* Main Section */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Contacts */}
        <aside className="w-80 border-r border-slate-800/80 bg-slate-900/10 flex flex-col overflow-hidden">
          <div className="p-4 shrink-0 border-b border-slate-800/40 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg shadow-emerald-500/10"
              title="New Conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-slate-600 text-sm mt-8">No chats found.</p>
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

                return (
                  <button
                    key={c.phone}
                    onClick={() => setActiveChat(c)}
                    className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                      isActive
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-slate-100"
                        : "hover:bg-slate-900/50 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="w-10 h-10 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center font-bold shrink-0">
                      {c.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-sm truncate text-slate-200">
                          {c.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 ml-1">
                          {latestTime}
                        </span>
                      </div>
                      <p className="text-xs truncate mt-0.5">{latestText}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Message Panel */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {activeChat ? (
            <>
              {/* Chat Info Header */}
              <div className="bg-slate-900/20 border-b border-slate-800/80 px-6 py-4 flex items-center shrink-0">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                  {activeChat.name.substring(0, 1).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h2 className="font-bold text-sm leading-none">{activeChat.name}</h2>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    +{activeChat.phone}
                  </span>
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
                    <h3 className="font-bold text-sm">Start the Conversation</h3>
                    <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed">
                      This is the start of your chat history with <span className="text-slate-300 font-semibold">{activeChat.name}</span>. Send a message below to start.
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
                              className="max-w-full max-h-72 rounded-xl object-contain border border-slate-800 bg-slate-950 mt-1 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(`/api/media?id=${msg.mediaId}`, "_blank")}
                            />
                            {msg.text && msg.text !== "📷 Photo" && (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
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
                              className="max-w-full max-h-72 rounded-xl border border-slate-800 bg-slate-950 mt-1"
                            />
                            {msg.text && msg.text !== "🎥 Video" && (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                          </div>
                        );
                      }

                      if (type === "document") {
                        return (
                          <a
                            href={`/api/media?id=${msg.mediaId}`}
                            download={msg.fileName || "document"}
                            className="flex items-center space-x-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:bg-slate-950/70 transition-all text-slate-100 no-underline mt-1"
                          >
                            <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-xs block truncate">{msg.fileName || "Document"}</span>
                              <span className="text-[9px] text-slate-500 block">Download Attachment</span>
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
                            className="flex items-center space-x-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 hover:bg-slate-950/70 transition-all text-slate-100 no-underline mt-1"
                          >
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/20">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-xs block truncate">{msg.location.name || "Shared Location"}</span>
                              {msg.location.address && (
                                <span className="text-[9px] text-slate-500 block truncate">{msg.location.address}</span>
                              )}
                              <span className="text-[9px] text-emerald-400 block mt-0.5">Open in Google Maps</span>
                            </div>
                          </a>
                        );
                      }

                      return <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
                    };

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm relative ${
                            isMe
                              ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10"
                              : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                          }`}
                        >
                          {renderBubbleContent()}
                          
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                              isMe ? "text-slate-800/80" : "text-slate-500"
                            }`}
                          >
                            <span>{msgTime}</span>
                            {isMe && (
                              <span className="capitalize">({msg.status || "sent"})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 shrink-0 relative">
                
                {/* Previews of pending files/locations */}
                {pendingFile && (
                  <div className="mb-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/10 font-bold text-xs uppercase">
                        {pendingFileType === "image" ? "IMG" : pendingFileType === "video" ? "VID" : pendingFileType === "audio" ? "AUD" : "DOC"}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs block truncate text-slate-200">{pendingFile.name}</span>
                        <span className="text-[10px] text-slate-500 block">{(pendingFile.size / 1024 / 1024).toFixed(2)} MB • Ready to send</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setPendingFile(null); setPendingFileType(null); }}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                )}

                {pendingLocation && (
                  <div className="mb-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs block truncate text-slate-200">{pendingLocation.name}</span>
                        <span className="text-[10px] text-slate-500 block">{pendingLocation.latitude}, {pendingLocation.longitude}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPendingLocation(null)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                )}

                {/* Attachment Menu Popup */}
                {showAttachMenu && (
                  <div className="absolute bottom-20 left-4 bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl z-40 w-48 space-y-1 animate-slide-up">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.accept = "image/*";
                          fileInputRef.current.click();
                        }
                      }}
                      className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-800/80 rounded-xl text-slate-300 hover:text-slate-100 transition-all text-xs font-semibold"
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
                      className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-800/80 rounded-xl text-slate-300 hover:text-slate-100 transition-all text-xs font-semibold"
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
                      className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-800/80 rounded-xl text-slate-300 hover:text-slate-100 transition-all text-xs font-semibold"
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
                      className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-800/80 rounded-xl text-slate-300 hover:text-slate-100 transition-all text-xs font-semibold"
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
                      className="w-full text-left flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-800/80 rounded-xl text-slate-300 hover:text-slate-100 transition-all text-xs font-semibold"
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

                <form onSubmit={handleSend} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 border border-slate-800/80 hover:bg-slate-900 active:scale-95 ${
                      showAttachMenu ? "bg-slate-900 border-slate-700 text-emerald-400" : "bg-slate-900/40 text-slate-400 hover:text-slate-200"
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
                    className="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                  
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-semibold rounded-xl text-sm transition-all flex items-center justify-center disabled:opacity-55"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold">No Conversation Selected</h2>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Select a contact from the sidebar or click the plus <span className="text-emerald-400 font-semibold">+</span> icon to start a new chat.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
            <button
              onClick={() => setIsNewChatOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h2 className="text-xl font-bold mb-4 pr-8">New Conversation</h2>

            {/* Tab Headers */}
            <div className="flex border-b border-slate-800 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setNewChatTab("directory")}
                className={`flex-1 pb-2.5 text-sm font-semibold transition-all border-b-2 ${
                  newChatTab === "directory"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
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
                    : "border-transparent text-slate-400 hover:text-slate-200"
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
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 mb-3 shrink-0"
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
                          className="w-full text-left flex justify-between items-center px-4 py-3 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/30 rounded-xl transition-all"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-200">{dc.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">+{dc.phone}</div>
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
                      <p className="text-center text-slate-500 text-sm py-8">No matching contacts found.</p>
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
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">Phone Number (with Country Code)</label>
                    <input
                      type="text"
                      placeholder="e.g. 923160924151"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1.5">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col">
            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h2 className="text-xl font-bold mb-4">Share Location</h2>

            <button
              type="button"
              onClick={handleShareCurrentLocation}
              className="w-full py-3 mb-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl border border-emerald-500/20 transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>📍</span>
              <span>Use Current Geolocation</span>
            </button>

            <div className="relative flex py-2 items-center shrink-0">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold">OR MANUALLY ENTER</span>
              <div className="flex-grow border-t border-slate-800"></div>
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
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Latitude</label>
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
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Longitude</label>
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
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Place Name</label>
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
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1.5">Full Address (Optional)</label>
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
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm"
              >
                Confirm Location Attachment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
