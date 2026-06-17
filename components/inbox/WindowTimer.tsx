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
};

export default function WindowTimer({ contact, compact = false }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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
