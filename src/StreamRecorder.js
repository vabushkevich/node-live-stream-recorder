const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const os = require("os");
const { addMilliseconds } = require('date-fns');
const { formatDate, saveFrame, getBrowser } = require('lib/utils');
const { nanoid } = require('nanoid');
const StreamPage = require('lib/stream-page/StreamPage');
const { throttle } = require('lodash');

const SAVE_EVERY_MS = 10000;
const SCREENSHOT_FREQ = 15000;

class StreamRecorder {
  constructor(url, quality = 720) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stream-recorder-"));
    
    this.id = nanoid();
    this.url = url;
    this.quality = quality;
    this.state = "idle";
    this.createdDate = new Date();
    this.name = formatDate(this.createdDate);
    this.outputVideoPath = `./recordings/${this.name}.mkv`;
    this.screenshotPath = `./site/screenshots/${this.id}.jpg`;
    this.collectedData = [];
    this.dataChunkPath = path.join(tmpDir, this.name);
  }

  log(message) {
    console.log(`[${this.name}]: ${message.replace("\n", "")}`);
  }

  stopOn(date) {
    this.finishDate = date;
    this.autoStopTimeout = setTimeout(() => this.stop(), date - new Date());
  }

  undoAutoStop() {
    clearTimeout(this.autoStopTimeout);
  }

  pause() {
    this.state = "paused";
    this.undoAutoStop();
    this.pausedDate = new Date();
  }

  resume() {
    this.state = "recording";
    this.stopOn(addMilliseconds(this.finishDate, new Date() - this.pausedDate));
  }

  prolong(duration) {
    this.undoAutoStop();
    this.stopOn(addMilliseconds(this.finishDate, duration));
  }

  async setQuality(quality) {
    await this.streamPage.setQuality(quality)
      .then(quality => this.log(`Quality has been set to: ${quality}`))
      .catch(err => this.log(`Can't set quality: ${err}`));
  }

  async saveCollectedData() {
    const dataToSave = this.collectedData.slice();
    const fileStream = fs.createWriteStream(this.outputVideoPath, { flags: "a" });
    Readable.from(dataToSave).pipe(fileStream);
    this.collectedData.splice(0);
  }

  async start(duration) {
    this.state = "starting";
    this.log("Starting recorder");

    const page = await getBrowser().then(browser => browser.newPage());
    await page.goto(this.url);
    await page.evaluate(() => document.body.hidden = true);
    this.streamPage = StreamPage.create(page);
    this.streamPage.startStream();

    this.streamPage.once("data", async () => {
      this.state = "recording";
      this.startedDate = new Date();
      this.stopOn(addMilliseconds(new Date(), duration));
      this.log("Recorder has been started");
      this.setQuality(this.quality);
    });

    this.streamPage.on("data", buffer => {
      this.collectedData.push(buffer);
    });

    this.streamPage.on("data", throttle(() => {
      this.saveCollectedData()
        .catch(err => this.log(`Can't save collected data: ${err}`));
    }, SAVE_EVERY_MS, { leading: false }));

    this.streamPage.on("data", throttle(buffer => {
      fs.writeFileSync(this.dataChunkPath, buffer);
      saveFrame(this.dataChunkPath, this.screenshotPath)
        .catch(err => this.log(`Can't take screenshot: ${err}`));
    }, SCREENSHOT_FREQ));

    this.streamPage.on("qualityreset", () => {
      this.setQuality(this.quality);
    });

    this.streamPage.on("offline", () => {
      this.pause();
      this.log("Recorder is paused due to stream inactivity");
    });

    this.streamPage.on("online", () => {
      this.resume();
      this.log("Stream is now active");
    });

    this.streamPage.on("message", msg => this.log(msg));
  }

  async stop() {
    this.state = "stopped";
    this.undoAutoStop();
    this.log("Stopping recorder");
    await this.streamPage.close();
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      state: this.state,
      screenshotPath: path.relative("./site", this.screenshotPath),
      createdDate: this.createdDate,
      finishDate: this.finishDate,
    };
  }
}

module.exports = StreamRecorder;
