import type { Message } from "./types";
export { isMessageUnread } from "@/lib/read-state";

export const getEpochTime = () => Math.floor(Date.now() / 1000);

export function formatMessagePreview(msg?: Message, empty = "(New Conversation)"): string {
  if (!msg) return empty;
  if (msg.isDeleted) return "🚫 Deleted";
  switch (msg.type) {
    case "image":
      return "📷 Photo";
    case "sticker":
      return "🎭 Sticker";
    case "audio":
    case "voice":
      return msg.agentNote ? `🎤 ${msg.agentNote}` : "🎤 Voice message";
    case "video":
      return "🎥 Video";
    case "document":
      if (msg.fileName && /\.(mp4|m4v|mov|3gp)$/i.test(msg.fileName)) return "🎥 Video";
      return msg.fileName ? `📄 ${msg.fileName}` : "📄 File";
    case "location":
      return "📍 Location";
    case "system":
      if (msg.systemKind === "meta_verification") return "🔐 Verification code (check phone)";
      if (msg.systemKind === "reaction") return msg.text || "Reaction";
      if (msg.systemKind === "unsupported") return "⚠️ Unsupported message";
      return msg.text?.split("\n")[0] || "ℹ️ System message";
    default:
      if (msg.text === "(sticker message)") return "🎭 Sticker";
      return msg.text || "(message)";
  }
}

export function parseLeadName(fullName: string): { name: string; city: string } {
  const match = fullName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { name: match[1].trim(), city: match[2].trim() };
  return { name: fullName.trim(), city: "" };
}

export function formatChatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function isMessageVoiceNote(msg: Message): boolean {
  return (
    msg.isVoiceNote === true ||
    msg.type === "voice" ||
    msg.text === "🎤 Voice Note" ||
    msg.text === "🎵 Voice Note" ||
    msg.text === "🎵 Audio/Voice Note"
  );
}
