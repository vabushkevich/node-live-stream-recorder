const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const { addMilliseconds, differenceInMilliseconds } = require('date-fns');
const { formatDate, saveLastFrame, getBrowser } = require('lib/utils');
const { nanoid } = require('nanoid');
const StreamPage = require('lib/StreamPage');

const SCREENSHOT_FREQ = 10000;

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
  }

  log(message) {
    console.log(`[${this.name}]: ${message}`);
  }

  planFinish(date) {
    clearTimeout(this.plannedFinishTimeout);
    this.finishDate = date;
    this.plannedFinishTimeout = setTimeout(() => {
      this.stop();
    }, differenceInMilliseconds(this.finishDate, new Date()));
  }

  async setQuality(quality) {
    await this.streamPage.setQuality(quality)
      .then(quality => this.log(`Quality has been set to: ${quality}`))
      .catch(err => this.log(`Can't set quality: ${err}`));
  }

  async saveData(buffer) {
    const fileStream = fs.createWriteStream(this.outputVideoPath, { flags: "a" });
    Readable.from(buffer).pipe(fileStream);
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
    this.streamPage = new StreamPage(page);
    this.streamPage.startStream();

    this.streamPage.once("data", async () => {
      this.state = "recording";
      this.startedDate = new Date();
      this.lastScreenshotDate = new Date();
      this.prolong(duration);
      this.log("Recorder has been started");
      this.setQuality(this.quality);
    });

    this.streamPage.on("data", buffer => {
      this.saveData(buffer).catch(err => {
        this.log(`Can't save data: ${err}. Retry after 1s`);
        setTimeout(() => this.saveData(buffer), 1000);
      });
      if (differenceInMilliseconds(new Date(), this.lastScreenshotDate) > SCREENSHOT_FREQ) {
        this.lastScreenshotDate = new Date();
        this.takeScreenshot();
      }
    });

    this.streamPage.on("qualityreset", () => {
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

    this.streamPage.on("message", message => {
      this.log(message);
    });
  }

  async stop() {
    this.state = "stopped";
    clearTimeout(this.plannedFinishTimeout);
    this.log("Stopping recorder");
    await this.streamPage.close();
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
