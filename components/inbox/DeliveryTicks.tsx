"use client";

import type { Message } from "@/app/inbox/types";
import { normalizeDeliveryStatus } from "@/lib/message-status";

const TICK_COLORS = {
  sent: "#d9fdd3",
  delivered: "#d9fdd3",
  read: "#53bdeb",
  failed: "#fca5a5",
} as const;

function SingleCheck({ color }: { color: string }) {
  return (
    <svg className="inbox-tick-icon" viewBox="0 0 12 11" aria-hidden>
      <path
        fill={color}
        d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-8.15 10.081a.48.48 0 0 0 .378.14.515.515 0 0 0 .385-.178l8.15-10.081a.445.445 0 0 0-.073-.585z"
      />
    </svg>
  );
}

function DoubleCheck({ color }: { color: string }) {
  return (
    <svg className="inbox-tick-icon inbox-tick-icon--double" viewBox="0 0 16 11" aria-hidden>
      <path
        fill={color}
        d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.37-2.178a.488.488 0 0 0-.372-.17.457.457 0 0 0-.34.155.434.434 0 0 0-.102.34.441.441 0 0 0 .168.332l2.746 2.52a.48.48 0 0 0 .378.14.515.515 0 0 0 .385-.178l6.564-8.118a.445.445 0 0 0-.073-.585z"
      />
      <path
        fill={color}
        d="M15.562 1.794a.455.455 0 0 0-.304-.102.48.48 0 0 0-.382.178l-8.65 10.7-2.957-2.72a.457.457 0 0 0-.34-.155.457.457 0 0 0-.34.155.434.434 0 0 0-.102.34.441.441 0 0 0 .168.332l3.333 3.063a.48.48 0 0 0 .378.14.493.493 0 0 0 .384-.178l9.124-11.29a.445.445 0 0 0-.073-.585z"
      />
    </svg>
  );
}

export default function DeliveryTicks({ msg }: { msg: Message }) {
  if (msg.sender !== "me") return null;

  const status = normalizeDeliveryStatus(msg.status);

  if (status === "failed") {
    return (
      <span
        className="inbox-delivery-ticks inbox-delivery-ticks--failed"
        title={msg.deliveryError || "Failed to deliver"}
        aria-label="failed"
      >
        <svg className="inbox-tick-icon inbox-tick-icon--alert" fill="none" stroke={TICK_COLORS.failed} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  }

  const isRead = status === "read";
  const isDelivered = status === "delivered" || isRead;
  const color = isRead ? TICK_COLORS.read : isDelivered ? TICK_COLORS.delivered : TICK_COLORS.sent;

  return (
    <span className="inbox-delivery-ticks" aria-label={status} title={status}>
      {isDelivered ? <DoubleCheck color={color} /> : <SingleCheck color={color} />}
    </span>
  );
}
