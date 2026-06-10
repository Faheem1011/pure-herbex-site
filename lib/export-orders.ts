import type { CrmOrder } from "@/lib/crm-types";
import { ORDER_STATUS_META } from "@/lib/crm-types";

export const ORDER_EXPORT_HEADERS = [
  "order_id",
  "customer_name",
  "phone",
  "status",
  "address",
  "city",
  "area",
  "landmark",
  "tracking_number",
  "courier",
  "product",
  "quantity",
  "amount_pkr",
  "payment",
  "priority",
  "source",
  "agent_notes",
  "created_at",
  "updated_at",
  "last_status_at",
] as const;

export type OrderExportRow = Record<(typeof ORDER_EXPORT_HEADERS)[number], string>;

function fmtDate(ms: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function orderToExportRow(order: CrmOrder): OrderExportRow {
  const lastStatus = order.statusHistory?.[0];
  return {
    order_id: order.id,
    customer_name: order.customerName || "",
    phone: order.phone || "",
    status: ORDER_STATUS_META[order.status]?.label || order.status,
    address: order.address || "",
    city: order.city || "",
    area: order.area || "",
    landmark: order.landmark || "",
    tracking_number: order.trackingNumber || "",
    courier: order.courier || "",
    product: order.product || "",
    quantity: String(order.quantity ?? ""),
    amount_pkr: order.amount != null ? String(order.amount) : "",
    payment: order.paymentMethod || "",
    priority: order.priority || "normal",
    source: order.source || "",
    agent_notes: order.agentNotes || "",
    created_at: fmtDate(order.createdAt),
    updated_at: fmtDate(order.updatedAt),
    last_status_at: lastStatus ? fmtDate(lastStatus.at) : "",
  };
}

export function ordersToExportRows(orders: CrmOrder[]): OrderExportRow[] {
  return [...orders]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(orderToExportRow);
}

export function ordersToSheetValues(orders: CrmOrder[]): string[][] {
  const rows = ordersToExportRows(orders);
  return [
    [...ORDER_EXPORT_HEADERS],
    ...rows.map((r) => ORDER_EXPORT_HEADERS.map((h) => r[h])),
  ];
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ordersToCsv(orders: CrmOrder[]): string {
  const rows = ordersToExportRows(orders);
  const header = ORDER_EXPORT_HEADERS.join(",");
  const lines = rows.map((r) =>
    ORDER_EXPORT_HEADERS.map((h) => csvEscape(r[h])).join(",")
  );
  return [header, ...lines].join("\r\n");
}
