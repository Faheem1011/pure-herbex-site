"use client";

import { memo } from "react";
import type { Contact } from "@/app/inbox/types";
import { TAGS } from "@/app/inbox/constants";
import { getWindowTimerDisplay, WINDOW_TIMER_TONE_CLASS } from "@/lib/window-24h";
import { formatMessagePreview } from "@/app/inbox/utils";

type Props = {
  contact: Contact;
  isActive: boolean;
  latestTime: string;
  windowTick: number;
  showWindowTimer: boolean;
  useLightAvatars: boolean;
  hasCrmOrder: boolean;
  crmNeedsAction: boolean;
  onOpen: () => void;
  onMarkRead: () => void;
  onMenu: () => void;
  onUnblock: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

function ContactAvatar({
  name,
  light,
}: {
  name: string;
  light: boolean;
}) {
  if (light) {
    const seed = name.trim() || "?";
    return (
      <div className="w-full h-full flex items-center justify-center bg-teal-900/80 text-teal-100 text-[11px] font-bold uppercase">
        {seed.slice(0, 2)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&radius=50&backgroundColor=0d9488,0f766e,115e59,134e4a,0f172a`}
      alt={name}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover"
    />
  );
}

function ContactListRow({
  contact: c,
  isActive,
  latestTime,
  windowTick,
  showWindowTimer,
  useLightAvatars,
  hasCrmOrder,
  crmNeedsAction,
  onOpen,
  onMarkRead,
  onMenu,
  onUnblock,
  onPin,
  onArchive,
  onDelete,
}: Props) {
  const latestMsg = c.messages[c.messages.length - 1];
  const latestText = formatMessagePreview(latestMsg);
  const contactTag = TAGS.find((t) => t.id === c.tag);
  const timer = showWindowTimer
    ? getWindowTimerDisplay(c, windowTick)
    : { label: "", tone: "none" as const, title: "" };

  return (
    <div
      onClick={() => {
        onOpen();
        if (c.hasUnread && !c.blocked) onMarkRead();
      }}
      className={`group w-full text-left flex items-start space-x-3 px-4 py-3.5 rounded-2xl transition-colors border cursor-pointer relative ${
        isActive
          ? "bg-zinc-800 border-emerald-500/40 text-zinc-100 shadow-md ring-1 ring-emerald-500/20"
          : c.hasUnread
            ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200"
            : "border-transparent hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200"
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 72px" }}
    >
      {c.hasUnread && !isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      )}
      <div className="w-10 h-10 rounded-full shrink-0 relative mt-0.5 overflow-hidden bg-zinc-800">
        <ContactAvatar name={c.name} light={useLightAvatars} />
        {c.tag && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${contactTag?.color}`}
          />
        )}
        {c.hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-black text-zinc-950">
              {(c.unreadCount || 0) > 9 ? "9+" : c.unreadCount || 1}
            </span>
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3
            className={`font-semibold text-sm truncate flex items-center gap-1 ${c.hasUnread ? "text-zinc-100" : "text-zinc-200"}`}
          >
            {c.pinned && (
              <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            {c.name}
            {hasCrmOrder && (
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-md shrink-0 ${
                  crmNeedsAction
                    ? "bg-amber-500/25 text-amber-300"
                    : "bg-amber-500/15 text-amber-400/80"
                }`}
                title="Active order in CRM"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1 ml-1 shrink-0">
            {c.hasUnread && (
              <span className="text-emerald-400">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M18 6.41L16.59 5 12 9.58 7.41 5 6 6.41l6 6z" />
                  <path d="M18 13l-1.41-1.41L12 16.17l-4.59-4.58L6 13l6 6z" />
                </svg>
              </span>
            )}
            <span className="text-[10px] text-zinc-500 group-hover:opacity-0 transition-opacity duration-200">
              {latestTime}
            </span>
            {timer.label && timer.tone !== "none" && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${WINDOW_TIMER_TONE_CLASS[timer.tone]}`}
                title={timer.title}
                dir="rtl"
              >
                {timer.label}
              </span>
            )}
          </div>
        </div>
        <p
          className={`text-xs truncate mt-0.5 leading-normal pr-8 ${c.hasUnread ? "text-zinc-300 font-medium" : ""}`}
        >
          {latestText}
        </p>
        {contactTag && !c.blocked && (
          <span
            className={`inline-flex items-center px-2 py-0.5 mt-1.5 rounded-md text-[9px] font-semibold border ${contactTag.text} ${contactTag.border} ${contactTag.bg}`}
          >
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
          onClick={(e) => {
            e.stopPropagation();
            onUnblock();
          }}
          className="absolute right-12 top-3.5 md:right-14 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30"
        >
          Unblock
        </button>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMenu();
        }}
        className="absolute right-3 top-3.5 md:hidden p-1.5 text-zinc-500 hover:text-zinc-200"
        title="Chat options"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      <div
        className="absolute right-3 top-3.5 hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onPin}
          className={`p-1.5 hover:bg-zinc-800 rounded-lg transition-colors ${c.pinned ? "text-emerald-400" : "text-zinc-400 hover:text-emerald-400"}`}
          title={c.pinned ? "Unpin" : "Pin"}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          title={c.archived ? "Unarchive" : "Archive"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 hover:bg-rose-950/40 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
          title="Delete chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(ContactListRow);
