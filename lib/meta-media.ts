const VIDEO_EXT = /\.(mp4|m4v|mov|3gp|webm)$/i;

export function isVideoFile(file: { name: string; type?: string }): boolean {
  const mime = file.type || "";
  return mime.startsWith("video/") || VIDEO_EXT.test(file.name);
}

/** Meta video messages require H.264/AAC MP4 and often fail on phone recordings. */
export function shouldSendVideoAsDocument(file: { name: string; type?: string }): boolean {
  return isVideoFile(file);
}

export function normalizeVideoFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return VIDEO_EXT.test(base) ? base : `${base.replace(/\.[^.]+$/, "") || "video"}.mp4`;
}

export function isVoiceNoteFile(file: { name: string; type?: string }): boolean {
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  return name.endsWith(".ogg") || mime.includes("ogg") || name.startsWith("voice-note-");
}

export const VOICE_NOTE_MIME = "audio/ogg; codecs=opus";

export function normalizeVoiceNoteFile(file: File): File {
  const filename = file.name.toLowerCase().endsWith(".ogg")
    ? file.name
    : `voice-note-${Date.now()}.ogg`;
  return new File([file], filename, { type: VOICE_NOTE_MIME });
}

export function prepareMetaUploadFile(
  file: File,
  options: { sendAs?: "video" | "document" | "auto"; voiceNote?: boolean } = {}
): { blob: Blob; filename: string; category: string } {
  const sendAs = options.sendAs || "auto";

  if (sendAs === "video" && isVideoFile(file)) {
    const filename = normalizeVideoFilename(file.name);
    const blob = new File([file], filename, { type: "video/mp4" });
    return { blob, filename, category: "video" };
  }

  const asDocument =
    sendAs === "document" || (sendAs === "auto" && shouldSendVideoAsDocument(file));

  if (asDocument && isVideoFile(file)) {
    const filename = normalizeVideoFilename(file.name);
    return { blob: file, filename, category: "document" };
  }

  if (file.type?.startsWith("image/")) {
    return { blob: file, filename: file.name, category: "image" };
  }
  if (file.type?.startsWith("audio/") || options.voiceNote || isVoiceNoteFile(file)) {
    if (options.voiceNote || isVoiceNoteFile(file)) {
      const normalized = normalizeVoiceNoteFile(file);
      return { blob: normalized, filename: normalized.name, category: "audio" };
    }
    return { blob: file, filename: file.name, category: "audio" };
  }
  if (file.type?.startsWith("video/") || VIDEO_EXT.test(file.name)) {
    const filename = normalizeVideoFilename(file.name);
    const blob = new File([file], filename, { type: "video/mp4" });
    return { blob, filename, category: "video" };
  }
  if (file.type?.includes("sticker")) {
    return { blob: file, filename: file.name, category: "sticker" };
  }

  return { blob: file, filename: file.name, category: "document" };
}

export function isPlayableVideoDocument(
  type?: string,
  fileName?: string
): boolean {
  if (type === "video") return true;
  return type === "document" && !!fileName && VIDEO_EXT.test(fileName);
}
