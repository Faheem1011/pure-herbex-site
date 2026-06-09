declare module "opus-media-recorder" {
  export default class OpusMediaRecorder extends MediaRecorder {
    constructor(
      stream: MediaStream,
      options?: MediaRecorderOptions,
      workerOptions?: Record<string, unknown>
    );
  }
}
