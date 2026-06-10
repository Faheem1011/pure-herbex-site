import { kv } from "@vercel/kv";
import { normalizePhone } from "@/lib/blocked";
import {
  orderNeedsAction,
  orderNeedsAddress,
  orderNeedsTracking,
} from "@/lib/crm-order-utils";
import {
  ACTIVE_ORDER_STATUSES,
  type CrmOrder,
  type CrmOrderInput,
  type CrmOrderStats,
  type CrmOrdersSummary,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/crm-types";

const ORDERS_SET = "crm:orders:active";
const ARCHIVED_SET = "crm:orders:archived";
const orderKey = (id: string) => `crm:order:${id}`;
const phoneIndexKey = (phone: string) => `crm:phone:${normalizePhone(phone)}`;

function emptyStats(): CrmOrderStats {
  const stats = {
    total: 0,
    active: 0,
    needsAddress: 0,
    needsTracking: 0,
    needsAction: 0,
  } as CrmOrderStats;
  for (const s of ORDER_STATUSES) stats[s] = 0;
  return stats;
}

function applyStats(order: CrmOrder, stats: CrmOrderStats): void {
  stats.total += 1;
  stats[order.status] += 1;
  if (ACTIVE_ORDER_STATUSES.includes(order.status)) {
    stats.active += 1;
    if (orderNeedsAddress(order)) stats.needsAddress += 1;
    if (orderNeedsTracking(order)) stats.needsTracking += 1;
    if (orderNeedsAction(order)) stats.needsAction += 1;
  }
}

async function loadOrdersByIds(ids: string[]): Promise<CrmOrder[]> {
  if (ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const batch = await kv.mget(unique.map(orderKey));
  return batch.filter((o): o is CrmOrder => !!o);
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

export async function getOrdersByPhone(phone: string): Promise<CrmOrder[]> {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];
  const ids: string[] = (await kv.get(phoneIndexKey(normalized))) || [];
  const orders = await loadOrdersByIds(ids);
  return orders.sort((a, b) => b.createdAt - a.createdAt);
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
    province: input.province?.trim() || "",
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
    deliveredAt: input.deliveredAt,
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
  status?: OrderStatus | "active" | "all" | "archived";
  search?: string;
  phone?: string;
  limit?: number;
  includeArchived?: boolean;
}): Promise<CrmOrder[]> {
  if (options?.phone) {
    let list = await getOrdersByPhone(options.phone);
    const statusFilter = options.status || "all";
    if (statusFilter === "active") {
      list = list.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
    } else if (statusFilter === "archived") {
      const archivedIds = new Set(await kv.smembers(ARCHIVED_SET));
      list = list.filter((o) => archivedIds.has(o.id));
    } else if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list.slice(0, options.limit ?? 100);
  }

  const activeIds: string[] = (await kv.smembers(ORDERS_SET)) || [];
  const archivedIds: string[] =
    options?.includeArchived || options?.status === "archived"
      ? (await kv.smembers(ARCHIVED_SET)) || []
      : [];

  const idSet = new Set([...activeIds, ...archivedIds]);
  let list = await loadOrdersByIds([...idSet]);

  const statusFilter = options?.status || "active";
  if (statusFilter === "active") {
    list = list.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  } else if (statusFilter === "archived") {
    const archived = new Set(archivedIds);
    list = list.filter((o) => archived.has(o.id));
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
        (o.province || "").toLowerCase().includes(q) ||
        (o.address || "").toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (b.priority === "urgent" && a.priority !== "urgent") return 1;
    return b.updatedAt - a.updatedAt;
  });

  return list.slice(0, options?.limit ?? 500);
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
    if (fields.status === "delivered" && !next.deliveredAt) {
      next.deliveredAt = now;
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
  const orders = await loadOrdersByIds(ids);
  const stats = emptyStats();

  for (const order of orders) {
    applyStats(order, stats);
  }

  return stats;
}

export async function getOrdersSummary(): Promise<CrmOrdersSummary> {
  const ids: string[] = (await kv.smembers(ORDERS_SET)) || [];
  const orders = await loadOrdersByIds(ids);
  const byPhone: CrmOrdersSummary["byPhone"] = {};
  const counts = {
    active: 0,
    needsAddress: 0,
    needsTracking: 0,
    needsAction: 0,
  };

  const activeOrders = orders
    .filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  for (const order of activeOrders) {
    counts.active += 1;
    const needsAddress = orderNeedsAddress(order);
    const needsTracking = orderNeedsTracking(order);
    if (needsAddress) counts.needsAddress += 1;
    if (needsTracking) counts.needsTracking += 1;
    if (needsAddress || needsTracking) counts.needsAction += 1;

    if (!byPhone[order.phone]) {
      byPhone[order.phone] = {
        orderId: order.id,
        status: order.status,
        needsAddress,
        needsTracking,
      };
    }
  }

  return { byPhone, counts };
}

export async function getOrderIdsByPhone(phone: string): Promise<string[]> {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];
  return (await kv.get(phoneIndexKey(normalized))) || [];
}
