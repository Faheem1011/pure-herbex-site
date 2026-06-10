"use client";

import React, { memo } from "react";
import type { CrmOrder } from "@/lib/crm-types";
import { orderNeedsAddress, orderNeedsTracking } from "@/lib/crm-order-utils";
import OrderStatusBadge from "@/components/crm/OrderStatusBadge";

type Props = {
  order: CrmOrder;
  selected: boolean;
  onSelect: (order: CrmOrder) => void;
};

function OrderListItem({ order, selected, onSelect }: Props) {
  const needsAddress = orderNeedsAddress(order);
  const needsTracking = orderNeedsTracking(order);

  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className={`crm-order-row w-full text-left p-3.5 rounded-2xl border transition-all duration-150 ${
        selected
          ? "border-amber-500/40 bg-amber-500/8 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
          : "border-white/5 bg-zinc-900/30 hover:border-amber-500/15"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="font-bold text-sm text-zinc-100 truncate">{order.customerName}</p>
          <p className="text-[11px] text-zinc-500 font-mono">+{order.phone}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.trackingNumber ? (
        <p className="text-[10px] text-amber-400/90 font-mono truncate">#{order.trackingNumber}</p>
      ) : order.city || order.province ? (
        <p className="text-[10px] text-zinc-500 truncate">
          {[order.city, order.province].filter(Boolean).join(", ")}
        </p>
      ) : (
        <p className="text-[10px] text-zinc-600 italic">No address yet</p>
      )}

      <div className="flex flex-wrap gap-1 mt-1.5">
        {order.priority === "urgent" && (
          <span className="text-[9px] font-black text-rose-400 uppercase px-1.5 py-0.5 rounded bg-rose-500/10">
            Urgent
          </span>
        )}
        {needsAddress && (
          <span className="text-[9px] font-bold text-sky-300 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
            Needs address
          </span>
        )}
        {needsTracking && (
          <span className="text-[9px] font-bold text-orange-300 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
            Needs tracking
          </span>
        )}
      </div>
    </button>
  );
}

export default memo(OrderListItem);
