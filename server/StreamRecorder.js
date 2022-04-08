const StreamRecording = require('server/StreamRecording');

class StreamRecorder {
  constructor() {
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
