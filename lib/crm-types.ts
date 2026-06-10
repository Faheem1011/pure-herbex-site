export const ORDER_STATUSES = [
  "pending_details",
  "confirmed",
  "packed",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
  "returned",
  "failed_delivery",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending_details",
  "confirmed",
  "packed",
  "shipped",
  "in_transit",
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending_details: {
    label: "Needs details",
    color: "text-slate-300",
    bg: "bg-slate-500/15",
    border: "border-slate-500/30",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-sky-300",
    bg: "bg-sky-500/15",
    border: "border-sky-500/30",
  },
  packed: {
    label: "Packed",
    color: "text-violet-300",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
  },
  shipped: {
    label: "Shipped",
    color: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  in_transit: {
    label: "In transit",
    color: "text-orange-300",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-300",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
  },
  returned: {
    label: "Returned",
    color: "text-fuchsia-300",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/30",
  },
  failed_delivery: {
    label: "Failed delivery",
    color: "text-red-300",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
  },
};

export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "Islamabad",
  "GB",
  "AJK",
] as const;

export const COURIERS = [
  "TCS",
  "Leopards",
  "PostEx",
  "M&P",
  "Trax",
  "Rider",
  "Other",
] as const;

export type CrmOrder = {
  id: string;
  phone: string;
  customerName: string;
  status: OrderStatus;
  address?: string;
  city?: string;
  province?: string;
  area?: string;
  landmark?: string;
  deliveredAt?: number;
  trackingNumber?: string;
  courier?: string;
  product?: string;
  quantity?: number;
  amount?: number;
  paymentMethod?: "COD" | "paid" | "partial";
  agentNotes?: string;
  priority?: "normal" | "urgent";
  source: "inbox_confirm" | "manual";
  createdAt: number;
  updatedAt: number;
  statusHistory: Array<{ status: OrderStatus; at: number; note?: string }>;
};

export type CrmOrderStats = Record<OrderStatus, number> & {
  total: number;
  active: number;
  needsAddress: number;
  needsTracking: number;
  needsAction: number;
};

export type CrmPhoneSummary = {
  orderId: string;
  status: OrderStatus;
  needsAddress: boolean;
  needsTracking: boolean;
};

export type CrmOrdersSummary = {
  byPhone: Record<string, CrmPhoneSummary>;
  counts: {
    active: number;
    needsAddress: number;
    needsTracking: number;
    needsAction: number;
  };
};

export type CrmOrderInput = Partial<
  Omit<CrmOrder, "id" | "phone" | "createdAt" | "updatedAt" | "statusHistory">
> & {
  phone: string;
  customerName?: string;
  status?: OrderStatus;
  source?: CrmOrder["source"];
};
