const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const os = require("os");
const { formatDate, saveFrame, getBrowser, resolveAfter } = require('lib/utils');
const { nanoid } = require('nanoid');
const StreamPage = require('lib/stream-page/StreamPage');
const { throttle } = require('lodash');

const SAVE_EVERY_MS = 10000;
const SCREENSHOT_FREQ = 15000;
const RESTART_TIMEOUT = 2 * 60 * 1000;

class StreamRecorder {
  constructor(url, duration = 60 * 60 * 1000, quality = 720) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stream-recorder-"));

    this.id = nanoid();
    this.url = url;
    this.quality = quality;
    this.createdDate = new Date();
    this.name = formatDate(this.createdDate);
    this.outputVideoPath = `./recordings/${this.name}.mkv`;
    this.screenshotPath = `./site/screenshots/${this.id}.jpg`;
    this.collectedData = [];
    this.dataChunkPath = path.join(tmpDir, this.name);
    this.duration = duration;
    this.stateHistory = [];
    this.setState("idle");
  }

  log(message) {
    console.log(`[${this.name}]: ${message.replace("\n", "")}`);
  }

  stopAfter(duration) {
    this.undoPlannedStop();
    this.stopTimeout = setTimeout(() => this.stop(), duration);
  }

  undoPlannedStop() {
    clearTimeout(this.stopTimeout);
  }

  pause() {
    this.setState("paused");
    this.undoPlannedStop();
  }

  resume() {
    this.setState("recording");
    this.stopAfter(this.getTimeLeft());
  }

  prolong(duration) {
    this.duration += duration;
    if (this.state == "recording") {
      this.stopAfter(this.getTimeLeft());
    }
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

  async start() {
    this.setState("starting");
    this.log("Starting recorder");

    const page = await getBrowser().then(browser => browser.newPage());
    await page.goto(this.url);
    await page.evaluate(() => document.body.hidden = true);
    this.streamPage = StreamPage.create(page);
    this.streamPage.startStream();

    this.streamPage.once("data", async () => {
      this.setState("recording");
      this.stopAfter(this.getTimeLeft());
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
      Promise.race([
        new Promise(resolve => this.streamPage.once("online", resolve)),
        resolveAfter(RESTART_TIMEOUT).then(Promise.reject),
      ])
        .catch(() => this.restart());
    });

    this.streamPage.on("online", () => {
      this.resume();
      this.log("Stream is now active");
    });

    this.streamPage.on("message", msg => this.log(msg));
  }

  setState(state) {
    this.state = state;
    this.stateHistory.push({
      state: this.state,
      date: new Date(),
    });
  }

  getStateInfo(state) {
    const info = {
      state,
      duration: 0,
    };

    this.stateHistory.forEach((stateItem, i) => {
      if (stateItem.state != state) {
        return;
      }
      const nextStateItem = this.stateHistory[i + 1] || {
        date: new Date(),
      };
      info.duration += nextStateItem.date - stateItem.date;
    });

    return info;
  }

  getTimeLeft() {
    if (this.state == "stopped") {
      return 0;
    }
    return this.duration - this.getStateInfo("recording").duration;
  }

  async stop() {
    this.setState("stopped");
    this.undoPlannedStop();
    this.log("Stopping recorder");
    await this.streamPage.close();
  }

  async restart() {
    this.log("Restarting recorder");
    await this.stop();
    await this.start();
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      state: this.state,
      screenshotPath: path.relative("./site", this.screenshotPath),
      createdDate: this.createdDate,
      timeLeft: this.getTimeLeft(),
    };
  }
}

module.exports = StreamRecorder;
