import type { CrmOrder } from "@/lib/crm-types";
import { ORDER_STATUS_META } from "@/lib/crm-types";

export const ORDER_EXPORT_HEADERS = [
  "order_id",
  "customer_name",
  "phone",
  "status",
  "address",
  "city",
  "province",
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
  "delivered_at",
  "last_status_at",
  "archived",
] as const;

export type OrderExportRow = Record<(typeof ORDER_EXPORT_HEADERS)[number], string>;

function fmtDate(ms: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function orderToExportRow(
  order: CrmOrder,
  archived = false
): OrderExportRow {
  const lastStatus = order.statusHistory?.[0];
  return {
    order_id: order.id,
    customer_name: order.customerName || "",
    phone: order.phone || "",
    status: ORDER_STATUS_META[order.status]?.label || order.status,
    address: order.address || "",
    city: order.city || "",
    province: order.province || "",
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
    delivered_at: order.deliveredAt ? fmtDate(order.deliveredAt) : "",
    last_status_at: lastStatus ? fmtDate(lastStatus.at) : "",
    archived: archived ? "yes" : "no",
  };
}

export function ordersToExportRows(
  orders: CrmOrder[],
  archivedIds?: Set<string>
): OrderExportRow[] {
  return [...orders]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((o) => orderToExportRow(o, archivedIds?.has(o.id)));
}

export function ordersToSheetValues(
  orders: CrmOrder[],
  archivedIds?: Set<string>
): string[][] {
  const rows = ordersToExportRows(orders, archivedIds);
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
