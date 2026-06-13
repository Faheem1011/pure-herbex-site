"use client";

import type { Message } from "@/app/inbox/types";
import { normalizeDeliveryStatus } from "@/lib/message-status";

export default function DeliveryTicks({ msg }: { msg: Message }) {
  if (msg.sender !== "me") return null;

  const status = normalizeDeliveryStatus(msg.status);

  if (status === "failed") {
    return (
      <span className="inline-flex items-center text-rose-300" title={msg.deliveryError || "Failed"}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  }

  const isRead = status === "read";
  const isDelivered = status === "delivered" || isRead;
  // Light ticks on green outgoing bubbles — dark grey was nearly invisible
  const color = isRead ? "text-[#53bdeb]" : "text-[#ffffffb3]";

  return (
    <span className={`inline-flex shrink-0 ${color}`} aria-label={status}>
      <svg className="w-4 h-[15px]" viewBox="0 0 16 15" fill="currentColor" aria-hidden>
        {isDelivered ? (
          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.516.063L8.977 10.29 6.439 7.754a.375.375 0 0 0-.588.458l1.838 2.447a.375.375 0 0 0 .588 0l6.504-8.163a.366.366 0 0 0-.016-.516zM4.92 10.29l-.478-.372a.365.365 0 0 0-.516.063l-2.43 3.223a.375.375 0 0 0 .588.458l2.43-3.223z" />
        ) : (
          <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.516.063L4.92 10.29 2.384 7.754a.375.375 0 0 0-.588.458l1.838 2.447a.375.375 0 0 0 .588 0l6.192-8.177a.365.365 0 0 0-.063-.516z" />
        )}
      </svg>
    </span>
  );
}
