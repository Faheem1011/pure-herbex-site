export function normalizeDeliveryStatus(status: string | undefined): string {
  if (!status) return "sent";
  const s = status.toLowerCase().trim();
  if (s === "played") return "read";
  if (s === "pending") return "sent";
  return s;
}

export function deliveryStatusRank(status: string | undefined): number {
  switch (normalizeDeliveryStatus(status)) {
    case "failed":
      return 0;
    case "sent":
      return 1;
    case "delivered":
      return 2;
    case "read":
      return 3;
    default:
      return 0;
  }
}

export function shouldUpgradeDeliveryStatus(
  current: string | undefined,
  incoming: string
): boolean {
  const next = normalizeDeliveryStatus(incoming);
  if (next === "failed") return true;
  return deliveryStatusRank(next) > deliveryStatusRank(current);
}
