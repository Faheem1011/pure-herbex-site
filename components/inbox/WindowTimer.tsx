"use client";

import { useEffect, useState } from "react";
import {
  getWindowTimerDisplay,
  WINDOW_TIMER_TONE_CLASS,
  type WindowContact,
} from "@/lib/window-24h";

type Props = {
  contact: WindowContact;
  compact?: boolean;
  /** Shared tick from parent — avoids hundreds of intervals on the contact list. */
  now?: number;
};

export default function WindowTimer({ contact, compact = false, now: nowProp }: Props) {
  const [localNow, setLocalNow] = useState(() => Date.now());

  useEffect(() => {
    if (nowProp != null) return;
    const id = setInterval(() => setLocalNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [nowProp]);

  const now = nowProp ?? localNow;
  const { label, tone, title } = getWindowTimerDisplay(contact, now);
  if (!label || tone === "none") return null;

  const className = WINDOW_TIMER_TONE_CLASS[tone];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${className}`}
        title={title}
        dir="rtl"
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${className}`}
      title={title}
      dir="rtl"
    >
      ⏱ {label}
    </span>
  );
}
