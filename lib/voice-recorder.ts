export const VOICE_NOTE_MIME = "audio/ogg;codecs=opus";
export const VOICE_NOTE_UPLOAD_MIME = "audio/ogg";
const WORKER_BASE = "/opus-media-recorder";
const MIN_VOICE_NOTE_BYTES = 500;

export type VoiceRecordingSession = {
  stopAndGetFile: () => Promise<File>;
  cancel: () => void;
};

function getWorkerOptions() {
  return {
    encoderWorkerFactory: () =>
      new Worker(`${WORKER_BASE}/encoderWorker.umd.js`),
    OggOpusEncoderWasmPath: `${WORKER_BASE}/OggOpusEncoder.wasm`,
    WebMOpusEncoderWasmPath: `${WORKER_BASE}/WebMOpusEncoder.wasm`,
  };
}

function isValidOggContainer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const header = new Uint8Array(buffer, 0, 4);
  return (
    header[0] === 0x4f &&
    header[1] === 0x67 &&
    header[2] === 0x67 &&
    header[3] === 0x53
  );
}

async function blobToValidatedVoiceFile(blob: Blob): Promise<File> {
  if (blob.size < MIN_VOICE_NOTE_BYTES) {
    throw new Error("Recording too short. Hold the mic for at least 1 second.");
  }

  const buffer = await blob.arrayBuffer();
  if (!isValidOggContainer(buffer)) {
    throw new Error("Recording format error. Please try again.");
  }

  return new File([blob], `voice-note-${Date.now()}.ogg`, {
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

  const chunks: Blob[] = [];
  const OpusMediaRecorder = (await import("opus-media-recorder")).default;
  const recorder = new OpusMediaRecorder(
    stream,
    { mimeType: "audio/ogg;codecs=opus", audioBitsPerSecond: 64000 },
    getWorkerOptions()
  ) as unknown as MediaRecorder;

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
            const blob = new Blob(chunks, { type: VOICE_NOTE_UPLOAD_MIME });
            const file = await blobToValidatedVoiceFile(blob);
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
          if (typeof recorder.requestData === "function") {
            recorder.requestData();
          }
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
