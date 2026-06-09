import { TAGS } from "@/app/inbox/constants";

export type ExportableContact = {
  name?: string;
  phone?: string;
  tag?: string | null;
  archived?: boolean;
  blocked?: boolean;
};

export type ContactExportRow = {
  name: string;
  phone: string;
  tag: string;
};

const TAG_LABELS: Record<string, string> = Object.fromEntries(
  TAGS.map((t) => [t.id, t.label])
);

export function tagLabel(tagId?: string | null): string {
  if (!tagId) return "";
  return TAG_LABELS[tagId] || tagId;
}

export function toExportRows(contacts: ExportableContact[]): ContactExportRow[] {
  return contacts
    .filter((c) => c.phone)
    .map((c) => ({
      name: (c.name || "Unknown").trim(),
      phone: String(c.phone).replace(/\D/g, ""),
      tag: tagLabel(c.tag),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function contactsToCsv(rows: ContactExportRow[]): string {
  const header = "name,phone,tag";
  const lines = rows.map((r) =>
    [csvEscape(r.name), csvEscape(r.phone), csvEscape(r.tag)].join(",")
  );
  return [header, ...lines].join("\r\n");
}

export function contactsToJson(rows: ContactExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}
