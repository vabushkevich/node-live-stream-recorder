const StreamRecording = require('lib/StreamRecording');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require("os");

class StreamRecorder {
  constructor() {
    this.recordings = [];
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stream-recorder-"));
  }

  static async create() {
    const self = new this();
    self.browser = await puppeteer.launch({
      executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      // userDataDir: "C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data",
      // headless: false,
      // defaultViewport: {
      //   width: 1920,
      //   height: 1080,
      // },
    });
    return self;
  }

  createRecording(url, opts = {}) {
    const recording = new StreamRecording(this, url, opts);
    this.recordings.push(recording);
    return recording;
  }

  getRecording(id) {
    return this.recordings.find((r) => r.id === id);
  }

  removeRecording(id) {
    this.recordings.splice(this.recordings.findIndex((r) => r.id == id), 1);
  }
}

module.exports = StreamRecorder;
