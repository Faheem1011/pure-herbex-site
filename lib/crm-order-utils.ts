import type { CrmOrder } from "@/lib/crm-types";
import { ACTIVE_ORDER_STATUSES } from "@/lib/crm-types";

export function orderNeedsAddress(order: CrmOrder): boolean {
  return (
    ACTIVE_ORDER_STATUSES.includes(order.status) &&
    !(order.address || "").trim()
  );
}

export function orderNeedsTracking(order: CrmOrder): boolean {
  return (
    ["packed", "shipped", "in_transit"].includes(order.status) &&
    !(order.trackingNumber || "").trim()
  );
}

export function orderNeedsAction(order: CrmOrder): boolean {
  return orderNeedsAddress(order) || orderNeedsTracking(order);
}
