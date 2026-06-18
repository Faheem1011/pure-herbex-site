import { normalizePhone } from "@/lib/blocked";

/** Digit variants for PK search: 03XX… ↔ 923XX… */
export function phoneSearchVariants(query: string): string[] {
  const d = normalizePhone(query);
  if (!d) return [];
  const set = new Set<string>([d]);
  if (d.startsWith("0") && d.length >= 4) {
    set.add("92" + d.slice(1));
  }
  if (d.startsWith("92") && d.length >= 5) {
    set.add("0" + d.slice(2));
  }
  return [...set];
}

export function phoneMatchesSearch(phone: string, query: string): boolean {
  const phoneDigits = normalizePhone(phone);
  if (!phoneDigits || !query.trim()) return false;
  for (const variant of phoneSearchVariants(query)) {
    if (phoneDigits.includes(variant)) return true;
  }
  return false;
}

export function contactMatchesSearch(
  name: string,
  phone: string,
  query: string
): boolean {
  const q = query.trim();
  if (!q) return true;
  if (name.toLowerCase().includes(q.toLowerCase())) return true;
  return phoneMatchesSearch(phone, q);
}
