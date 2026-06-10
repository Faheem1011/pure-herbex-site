import { kv } from "@vercel/kv";
import { normalizePhone } from "@/lib/blocked";
import {
  ACTIVE_ORDER_STATUSES,
  type CrmOrder,
  type CrmOrderInput,
  type CrmOrderStats,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/crm-types";

const ORDERS_SET = "crm:orders:active";
const ARCHIVED_SET = "crm:orders:archived";
const orderKey = (id: string) => `crm:order:${id}`;
const phoneIndexKey = (phone: string) => `crm:phone:${normalizePhone(phone)}`;

function emptyStats(): CrmOrderStats {
  const stats = { total: 0, active: 0 } as CrmOrderStats;
  for (const s of ORDER_STATUSES) stats[s] = 0;
  return stats;
}

export async function findActiveOrderByPhone(phone: string): Promise<CrmOrder | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const ids: string[] = (await kv.get(phoneIndexKey(normalized))) || [];
  for (const id of ids) {
    const order = (await kv.get(orderKey(id))) as CrmOrder | null;
    if (order && ACTIVE_ORDER_STATUSES.includes(order.status)) {
      return order;
    }
  }
  return null;
}

export async function createOrder(input: CrmOrderInput): Promise<CrmOrder> {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("Invalid phone number");

  const existing = await findActiveOrderByPhone(phone);
  if (existing) {
    throw new Error(`ACTIVE_ORDER_EXISTS:${existing.id}`);
  }

  const now = Date.now();
  const status: OrderStatus = input.status || "pending_details";
  const order: CrmOrder = {
    id: `ord_${now}_${Math.random().toString(36).slice(2, 7)}`,
    phone,
    customerName: input.customerName?.trim() || "WhatsApp Customer",
    status,
    address: input.address?.trim() || "",
    city: input.city?.trim() || "",
    area: input.area?.trim() || "",
    landmark: input.landmark?.trim() || "",
    trackingNumber: input.trackingNumber?.trim() || "",
    courier: input.courier || "",
    product: input.product?.trim() || "Pure Herbex",
    quantity: input.quantity ?? 1,
    amount: input.amount,
    paymentMethod: input.paymentMethod || "COD",
    agentNotes: input.agentNotes?.trim() || "",
    priority: input.priority || "normal",
    source: input.source || "manual",
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status, at: now, note: "Order created" }],
  };

  await kv.set(orderKey(order.id), order);
  await kv.sadd(ORDERS_SET, order.id);

  const existingIds: string[] = (await kv.get(phoneIndexKey(phone))) || [];
  await kv.set(phoneIndexKey(phone), [order.id, ...existingIds.filter((id) => id !== order.id)]);

  return order;
}

export async function getOrderById(id: string): Promise<CrmOrder | null> {
  return (await kv.get(orderKey(id))) as CrmOrder | null;
}

export async function listOrders(options?: {
  status?: OrderStatus | "active" | "all";
  search?: string;
  limit?: number;
}): Promise<CrmOrder[]> {
  const ids: string[] = (await kv.smembers(ORDERS_SET)) || [];
  const orders = (await kv.mget(ids.map(orderKey))) as (CrmOrder | null)[];
  let list = orders.filter((o): o is CrmOrder => !!o);

  const statusFilter = options?.status || "active";
  if (statusFilter === "active") {
    list = list.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  } else if (statusFilter !== "all") {
    list = list.filter((o) => o.status === statusFilter);
  }

  const q = options?.search?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.trackingNumber || "").toLowerCase().includes(q) ||
        (o.city || "").toLowerCase().includes(q) ||
        (o.address || "").toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (b.priority === "urgent" && a.priority !== "urgent") return 1;
    return b.updatedAt - a.updatedAt;
  });

  const limit = options?.limit ?? 500;
  return list.slice(0, limit);
}

export async function updateOrder(
  id: string,
  patch: Partial<CrmOrder> & { statusNote?: string }
): Promise<CrmOrder> {
  const order = await getOrderById(id);
  if (!order) throw new Error("Order not found");

  const now = Date.now();
  const { statusNote, ...fields } = patch;
  const next: CrmOrder = {
    ...order,
    ...fields,
    id: order.id,
    phone: order.phone,
    createdAt: order.createdAt,
    updatedAt: now,
    statusHistory: [...order.statusHistory],
  };

  if (fields.status && fields.status !== order.status) {
    next.statusHistory.unshift({
      status: fields.status,
      at: now,
      note: statusNote || `Status → ${fields.status}`,
    });
    if (next.statusHistory.length > 50) {
      next.statusHistory = next.statusHistory.slice(0, 50);
    }
  }

  await kv.set(orderKey(id), next);
  return next;
}

export async function archiveOrder(id: string): Promise<void> {
  const order = await getOrderById(id);
  if (!order) throw new Error("Order not found");
  await kv.srem(ORDERS_SET, id);
  await kv.sadd(ARCHIVED_SET, id);
}

export async function getOrderStats(): Promise<CrmOrderStats> {
  const ids: string[] = (await kv.smembers(ORDERS_SET)) || [];
  const orders = (await kv.mget(ids.map(orderKey))) as (CrmOrder | null)[];
  const stats = emptyStats();

  for (const order of orders) {
    if (!order) continue;
    stats.total += 1;
    stats[order.status] += 1;
    if (ACTIVE_ORDER_STATUSES.includes(order.status)) stats.active += 1;
  }

  return stats;
}

export async function getOrderIdsByPhone(phone: string): Promise<string[]> {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];
  return (await kv.get(phoneIndexKey(normalized))) || [];
}
