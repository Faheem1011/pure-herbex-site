import {
  contactsToCsv,
  contactsToJson,
  toExportRows,
  type ExportableContact,
} from "@/lib/export-contacts";

export type ExportFormat = "csv" | "json";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Download main inbox contacts from the server (name, phone, tag). */
export async function exportMainInboxContacts(
  sessionToken: string,
  format: ExportFormat = "csv"
): Promise<{ count: number; filename: string }> {
  const res = await fetch(`/api/contacts/export/?format=${format}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename =
    match?.[1] ||
    `pure-herbex-inbox-contacts-${new Date().toISOString().slice(0, 10)}.${format}`;

  downloadBlob(blob, filename);

  const countHeader = res.headers.get("X-Contact-Count");
  const count = countHeader ? parseInt(countHeader, 10) : 0;

  return { count, filename };
}

/** Export from contacts already loaded in the inbox UI (offline-friendly). */
export function exportMainInboxContactsLocal(
  contacts: ExportableContact[],
  format: ExportFormat = "csv"
): { count: number; filename: string } {
  const rows = toExportRows(contacts);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `pure-herbex-inbox-contacts-${stamp}.${format}`;

  const content = format === "json" ? contactsToJson(rows) : contactsToCsv(rows);
  const mime = format === "json" ? "application/json" : "text/csv";
  downloadBlob(new Blob([content], { type: `${mime};charset=utf-8` }), filename);

  return { count: rows.length, filename };
}
