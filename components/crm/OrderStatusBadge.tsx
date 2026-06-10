"use client";

import { ORDER_STATUS_META, type OrderStatus } from "@/lib/crm-types";

type Props = {
  status: OrderStatus;
  size?: "sm" | "md";
};

export default function OrderStatusBadge({ status, size = "sm" }: Props) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${meta.bg} ${meta.border} ${meta.color} ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {meta.label}
    </span>
  );
}
