import { remuxWebmToOgg } from "@/lib/webm-opus-to-ogg";

export const VOICE_NOTE_UPLOAD_MIME = "audio/ogg; codecs=opus";
const MIN_VOICE_NOTE_BYTES = 500;

const PREFERRED_MIMES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/webm",
];

export type VoiceRecordingSession = {
  stopAndGetFile: () => Promise<File>;
  cancel: () => void;
};

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not supported in this browser");
  }
  for (const mime of PREFERRED_MIMES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  throw new Error("This browser cannot record Opus audio for voice notes");
}

function hasOpusHead(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  const head = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 64)));
  return head.includes("OpusHead");
}

async function toWhatsAppVoiceFile(recordedBlob: Blob): Promise<File> {
  const oggBlob = await remuxWebmToOgg(recordedBlob);

  if (oggBlob.size < MIN_VOICE_NOTE_BYTES) {
    throw new Error("Recording too short. Hold the mic for at least 1 second.");
  }

  const buffer = await oggBlob.arrayBuffer();
  const header = new Uint8Array(buffer, 0, 4);
  const isOgg =
    header[0] === 0x4f &&
    header[1] === 0x67 &&
    header[2] === 0x67 &&
    header[3] === 0x53;

  if (!isOgg || !hasOpusHead(buffer)) {
    throw new Error("Recording format error. Please try again.");
  }

  return new File([oggBlob], `voice-note-${Date.now()}.ogg`, {
    type: VOICE_NOTE_UPLOAD_MIME,
    lastModified: Date.now(),
  });
}

export async function startVoiceRecording(): Promise<VoiceRecordingSession> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const mimeType = pickRecorderMimeType();
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  recorder.start();

  const cleanup = () => {
    stream.getTracks().forEach((track) => track.stop());
  };

  return {
    stopAndGetFile: () =>
      new Promise<File>((resolve, reject) => {
        recorder.onstop = async () => {
          cleanup();
          try {
            const recorded = new Blob(chunks, { type: mimeType });
            const file = await toWhatsAppVoiceFile(recorded);
            resolve(file);
          } catch (err) {
            reject(err);
          }
        };
        recorder.onerror = () => {
          cleanup();
          reject(new Error("Voice recording failed"));
        };
        try {
          recorder.stop();
        } catch (err) {
          cleanup();
          reject(err);
        }
      }),
    cancel: () => {
      try {
        recorder.onstop = () => cleanup();
        recorder.stop();
      } catch {
        cleanup();
      }
    },
  };
}
