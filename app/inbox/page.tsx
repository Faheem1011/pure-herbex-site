"use client";

import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: number;
  status?: string;
}

interface Contact {
  name: string;
  phone: string;
  messages: Message[];
}

const ACCESS_PASSWORD = "PureHerbex2026!";

export default function InboxPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Check login on load
  useEffect(() => {
    const savedPass = sessionStorage.getItem("inbox_password");
    if (savedPass === ACCESS_PASSWORD) {
      setIsLoggedIn(true);
    }
  }, []);

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
          setContacts(sorted);

          // Update active chat history if open
          if (activeChat) {
            const updatedActive = sorted.find((c: Contact) => c.phone === activeChat.phone);
            if (updatedActive) {
              setActiveChat(updatedActive);
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
  }, [isLoggedIn, activeChat?.phone]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_PASSWORD}`,
        },
        body: JSON.stringify({
          toPhone: activeChat.phone,
          replyText: replyText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        // Optimistically append message to current thread
        const newMsg: Message = {
          id: data.msgId,
          sender: "me",
          text: replyText,
          timestamp: Math.floor(Date.now() / 1000),
          status: "sent",
        };
        const updatedChat = {
          ...activeChat,
          messages: [...activeChat.messages, newMsg],
        };
        setActiveChat(updatedChat);
        setReplyText("");
      } else {
        alert("Failed to send message: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error sending message.");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("inbox_password");
    setIsLoggedIn(false);
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
            <h1 class="text-2xl font-bold tracking-tight">Pure Herbex Inbox</h1>
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
      
      <!-- Header -->
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

      <!-- Main Section -->
      <div className="flex flex-1 overflow-hidden">
        
        <!-- Sidebar Contacts -->
        <aside className="w-80 border-r border-slate-800/80 bg-slate-900/10 flex flex-col overflow-hidden">
          <div className="p-4 shrink-0 border-b border-slate-800/40">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-slate-600 text-sm mt-8">No chats found.</p>
            ) : (
              filteredContacts.map((c) => {
                const latestMsg = c.messages[c.messages.length - 1];
                const latestText = latestMsg?.text || "(No messages)";
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

        <!-- Message Panel -->
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {activeChat ? (
            <>
              <!-- Chat Info Header -->
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

              <!-- Message History Bubble list -->
              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
                {activeChat.messages.map((msg) => {
                  const isMe = msg.sender === "me";
                  const msgTime = new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm relative ${
                          isMe
                            ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
                })}
                <div ref={messagesEndRef} />
              </div>

              <!-- Chat Input Form -->
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 shrink-0">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    required
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
                Select a contact from the sidebar to view chat history and reply.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
