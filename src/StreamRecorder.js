const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const { addMilliseconds, differenceInMilliseconds } = require('date-fns');
const { formatDate, saveLastFrame, getBrowser } = require('lib/utils');
const { nanoid } = require('nanoid');
const StreamPage = require('lib/stream-page/StreamPage');
const StreamPageController = require('lib/StreamPageController');
const { throttle } = require('lodash');

const SAVE_EVERY_MS = 10000;
const SCREENSHOT_FREQ = 15000;

class StreamRecorder {
  constructor(url, quality = 720) {
    this.id = nanoid();
    this.url = url;
    this.quality = quality;
    this.state = "idle";
    this.createdDate = new Date();
    this.name = formatDate(this.createdDate);
    this.outputVideoPath = `./recordings/${this.name}.mkv`;
    this.screenshotPath = `./site/screenshots/${this.id}.jpg`;
    this.collectedData = [];
  }

  log(message) {
    console.log(`[${this.name}]: ${message.replace("\n", "")}`);
  }

  planFinish(date) {
    clearTimeout(this.plannedFinishTimeout);
    this.finishDate = date;
    this.plannedFinishTimeout = setTimeout(() => {
      this.stop();
    }, differenceInMilliseconds(this.finishDate, new Date()));
  }

  async setQuality(quality) {
    await this.streamPageController.setQuality(quality)
      .then(quality => this.log(`Quality has been set to: ${quality}`))
      .catch(err => this.log(`Can't set quality: ${err}`));
  }

  async saveCollectedData() {
    const dataToSave = this.collectedData.slice();
    const fileStream = fs.createWriteStream(this.outputVideoPath, { flags: "a" });
    Readable.from(dataToSave).pipe(fileStream);
    this.collectedData.splice(0);
  }

  async takeScreenshot() {
    await saveLastFrame(this.outputVideoPath, this.screenshotPath)
      .catch(err => this.log(`Can't take screenshot: ${err}`));
  }

  async start(duration) {
    this.state = "starting";
    this.log("Starting recorder");

    const page = await getBrowser().then(browser => browser.newPage());
    await page.goto(this.url);
    this.streamPage = StreamPage.create(page);
    this.streamPageController = new StreamPageController(this.streamPage);
    this.streamPageController.startStream();

    this.streamPage.once("data", async () => {
      this.state = "recording";
      this.startedDate = new Date();
      this.prolong(duration);
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

    this.streamPage.on("data", throttle(() => {
      this.takeScreenshot();
    }, SCREENSHOT_FREQ, { leading: false }));

    this.streamPageController.on("qualityreset", () => {
      this.setQuality(this.quality);
    });

    this.streamPage.on("offline", () => {
      this.state = "paused";
      this.pausedDate = new Date();
      clearTimeout(this.plannedFinishTimeout);
      this.log("Recorder is paused due to stream inactivity");
    });

    this.streamPage.on("online", () => {
      this.state = "recording";
      this.prolong(differenceInMilliseconds(this.pausedDate, new Date()));
      this.log("Stream is now active");
    });

    this.streamPage.on("message", msg => this.log(msg));
    this.streamPageController.on("message", msg => this.log(msg));
  }

  async stop() {
    this.state = "stopped";
    clearTimeout(this.plannedFinishTimeout);
    this.log("Stopping recorder");
    await this.streamPageController.close();
  }

  prolong(duration) {
    this.planFinish(addMilliseconds(this.finishDate || new Date(), duration));
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
