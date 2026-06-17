export const MARKETING_TEMPLATE = "herbex_marketing";

export const TAGS = [
  { id: "Confirm", label: "Confirm", color: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { id: "Potential", label: "Potential Client", color: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "Important", label: "Important", color: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "1500", label: "1500", color: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  { id: "2000", label: "2000", color: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
  { id: "2500", label: "2500", color: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
  { id: "3000", label: "3000", color: "bg-lime-500", text: "text-lime-400", border: "border-lime-500/30", bg: "bg-lime-500/10" },
  { id: "Spam", label: "Spam", color: "bg-rose-500", text: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" },
] as const;

export type TagId = (typeof TAGS)[number]["id"];

export const VALID_TAG_IDS = new Set<string>(TAGS.map((t) => t.id));

export const COMMON_EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "✅", "🔥", "💪", "❤️", "🎉", "👋", "😊", "🤝", "💯", "⭐"];
