import { StreamRecording } from "@services/stream-recording";
import { EventEmitter } from "events";
import { RecordingSerialized } from "@types";

export class StreamRecorder extends EventEmitter {
  recordings: Map<string, StreamRecording>;

  constructor() {
    super();
    this.recordings = new Map();
  }

  async stop() {
    for (const [, recording] of this.recordings) {
      await recording.stop();
    }
  }

  createRecording(
    url: string,
    opts: {
      duration: number;
      resolution: number;
      name: string;
    },
  ) {
    const recording = new StreamRecording(url, opts);
    this.recordings.set(recording.id, recording);
    recording.on("update", (update: RecordingSerialized) => {
      this.emit("recordingupdate", { ...update, id: recording.id });
    });
    return recording;
  }

  getRecordings() {
    return [...this.recordings.values()]
      .map((recording) => recording.toJSON());
  }

  getRecording(id: string) {
    return this.recordings.get(id);
  }

  removeRecording(id: string) {
    this.recordings.delete(id);
  }
}
