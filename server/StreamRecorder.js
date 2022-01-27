const StreamRecording = require('server/StreamRecording');
const { nanoid } = require('nanoid');

class StreamRecorder {
  constructor() {
    this.recordings = new Map();
  }

  async stop() {
    for (const [id, recording] of this.recordings) {
      await recording.stop();
    }
  }

  createRecording(url, opts) {
    const recording = new StreamRecording(url, { ...opts, id: nanoid() });
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
