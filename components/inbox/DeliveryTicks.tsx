"use client";

import type { Message } from "@/app/inbox/types";

export default function DeliveryTicks({ msg }: { msg: Message }) {
  if (msg.sender !== "me") return null;

  if (msg.status === "failed") {
    return (
      <span className="inline-flex items-center text-rose-400" title={msg.deliveryError || "Failed"}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  }

  const isRead = msg.status === "read";
  const isDelivered = msg.status === "delivered" || isRead;
  const color = isRead ? "text-[#53bdeb]" : "text-[#8696a0]";

  return (
    <span className={`inline-flex ${color}`} aria-label={msg.status || "sent"}>
      <svg className="w-4 h-3.5" viewBox="0 0 16 11" fill="currentColor">
        <path d="M11.071.653a.457.457 0 0 0-.58-.088L4.92 5.04 2.653 2.773a.457.457 0 0 0-.646.646l2.75 2.75a.457.457 0 0 0 .646 0L11.16 1.21a.457.457 0 0 0-.089-.557z" />
        {isDelivered && (
          <path d="M14.071.653a.457.457 0 0 0-.58-.088L7.92 5.04 6.5 3.618a.457.457 0 0 0-.646.646l1.42 1.42a.457.457 0 0 0 .646 0L14.16 1.21a.457.457 0 0 0-.089-.557z" transform="translate(2 0)" />
        )}
      </svg>
    </span>
  );
}
