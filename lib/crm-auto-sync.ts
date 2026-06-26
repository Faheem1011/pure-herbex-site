import { kv } from "@/lib/kv";
import { listOrders } from "@/lib/crm-orders";
import { isGoogleSheetsConfigured, syncOrdersToGoogleSheet } from "@/lib/google-sheets";

const ARCHIVED_SET = "crm:orders:archived";
let syncInFlight: Promise<void> | null = null;

/** Background full-sheet sync after CRM mutations (non-blocking). */
export function scheduleOrdersSheetSync(): void {
  if (!isGoogleSheetsConfigured()) return;
  if (syncInFlight) return;

  syncInFlight = (async () => {
    try {
      const archivedIds = new Set<string>(
        ((await kv.smembers(ARCHIVED_SET)) as string[]) || []
      );
      const orders = await listOrders({
        status: "all",
        includeArchived: true,
        limit: 3000,
      });
      await syncOrdersToGoogleSheet(orders, archivedIds);
    } catch (e) {
      console.error("Auto Google Sheets sync failed", e);
    } finally {
      syncInFlight = null;
    }
  })();
}
