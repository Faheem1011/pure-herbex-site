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

type StatusMergeMsg = {
  id?: string;
  sender?: string;
  status?: string;
  deliveryError?: string;
  deliveryErrorCode?: number;
};

/** Apply webhook delivery upgrades from server slice onto local messages (same ids). */
export function mergeOutboundDeliveryStatus<T extends StatusMergeMsg>(
  localMsgs: T[],
  serverMsgs: T[]
): T[] {
  if (!serverMsgs.length) return localMsgs;
  const serverById = new Map(
    serverMsgs.filter((m) => m.id).map((m) => [m.id as string, m])
  );
  return localMsgs.map((local) => {
    if (local.sender !== "me" || !local.id) return local;
    const server = serverById.get(local.id);
    if (!server) return local;
    if (shouldUpgradeDeliveryStatus(local.status, server.status || "")) {
      return {
        ...local,
        status: normalizeDeliveryStatus(server.status),
        deliveryError: server.deliveryError ?? local.deliveryError,
        deliveryErrorCode: server.deliveryErrorCode ?? local.deliveryErrorCode,
      };
    }
    return local;
  });
}
