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

export function prepareMetaUploadFile(
  file: File,
  options: { sendAs?: "video" | "document" | "auto" } = {}
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
  if (file.type?.startsWith("audio/")) {
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
