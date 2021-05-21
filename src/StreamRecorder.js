const StreamRecording = require('lib/StreamRecording');
const { nanoid } = require('nanoid');
const puppeteer = require('puppeteer-core');

const {
  BROWSER_PATH,
} = require('lib/config');

class StreamRecorder {
  constructor() {
    this.recordings = new Map();
  }

  async start() {
    this.browser = await puppeteer.launch({
      executablePath: BROWSER_PATH,
    });
  }

  async stop() {
    for (const [id, recording] of this.recordings) {
      await recording.stop();
    }
    await this.browser.close();
  }

  createRecording(url, opts) {
    const recording = new StreamRecording(url, this.browser, { ...opts, id: nanoid() });
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
