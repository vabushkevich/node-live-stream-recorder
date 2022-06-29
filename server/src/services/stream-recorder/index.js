const StreamRecording = require('server/services/stream-recording');
const { EventEmitter } = require('events');

class StreamRecorder extends EventEmitter {
  constructor() {
    super();
    this.recordings = new Map();
  }

  async stop() {
    for (const [, recording] of this.recordings) {
      await recording.stop();
    }
  }

  createRecording(url, opts) {
    const recording = new StreamRecording(url, { ...opts });
    this.recordings.set(recording.id, recording);
    recording.on("update", (update) => {
      this.emit("recordingupdate", { ...update, id: recording.id });
    });
    return recording;
  }

  getRecordings() {
    return [...this.recordings.values()]
      .map((recording) => recording.toJSON());
  }

  getRecording(id) {
    return this.recordings.get(id);
  }

  removeRecording(id) {
    this.recordings.delete(id);
  }
}

module.exports = StreamRecorder;
