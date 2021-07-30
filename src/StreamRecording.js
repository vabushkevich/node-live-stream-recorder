const { writeFileSync } = require('fs');
const { mkdtempSync } = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { saveFrame, resolveAfter } = require('lib/utils');
const { throttle } = require('lodash');
const { format: formatDate } = require('date-fns');
const sanitizePath = require("sanitize-filename");
const M3u8Fetcher = require("lib/M3u8Fetcher");
const { YouTube, Twitch } = require('lib/stream-page');
const { EventEmitter } = require('events');

const {
  SCREENSHOT_FREQ,
  RECORDINGS_ROOT,
  SCREENSHOTS_ROOT,
  NO_DATA_TIMEOUT,
} = require('lib/config');

function createStreamPage(page) {
  const url = page.url();

  if (url.includes("youtube.com")) return new YouTube(page);
  if (url.includes("twitch.tv")) return new Twitch(page);

  throw new Error(`Can't get handle for url: ${url}`);
}

class StreamRecording extends EventEmitter {
  constructor(
    url,
    browser,
    {
      duration = 60 * 60 * 1000,
      quality = [
        { resolution: 360 },
        { resolution: 480 },
        { resolution: 240 },
        { resolution: 640 },
        { resolution: 720 },
      ],
      nameSuffix = "",
      id,
    } = {}
  ) {
    super();
    if (!id) throw new Error("Recording id must be specified");
    this.id = id;
    this.url = url;
    this.browser = browser;
    this.duration = duration;
    this.quality = quality;
    this.nameSuffix = sanitizePath(nameSuffix, { replacement: "-" }).trim();
    this.createdDate = new Date();
    this.name = this.buildName().trim();
    this.tmpDir = mkdtempSync(path.join(tmpdir(), "stream-recording-"));
    this.outputVideoPath = path.join(RECORDINGS_ROOT, `${this.name}.mkv`);
    this.screenshotPath = path.join(SCREENSHOTS_ROOT, `${this.id}.webp`);
    this.dataChunkPath = path.join(this.tmpDir, this.name);
    this.stateHistory = [];
    this.setState("idle");
  }

  buildName() {
    return `${formatDate(this.createdDate, "yyyy-MM-dd HH-mm-ss.SSS")} ${this.nameSuffix}`;
  }

  log(message) {
    console.log(`[${this.name}]: ${String(message).replace("\n", "")}`);
  }

  stopAfter(duration) {
    this.cancelScheduledStop();
    this.stopTimeout = setTimeout(() => this.stop(), duration);
  }

  cancelScheduledStop() {
    clearTimeout(this.stopTimeout);
  }

  resume() {
    this.setState("recording");
    this.stopAfter(this.getTimeLeft());
    this.log("Resumed");
  }

  prolong(duration) {
    this.duration += duration;
    if (this.state == "recording") {
      this.stopAfter(this.getTimeLeft());
    }
  }

  async openPage(url) {
    const page = await this.browser.newPage();
    await page.goto(url)
      .catch((err) => {
        if (err.name == "TimeoutError") {
          return Promise.reject("Page open timeout");
        }
        return Promise.reject(err);
      });
    await page.evaluate(() =>
      document.documentElement.style.display = "none !important"
    );
    return page;
  }

  async start() {
    let page;

    this.setState("starting");
    this.log("Starting");

    try {
      page = await this.openPage(this.url);
      const streamPage = createStreamPage(page);
      const m3u8 = await streamPage.getM3u8(this.quality);

      this.m3u8Fetcher = new M3u8Fetcher(m3u8.url);
      this.setUpM3u8FetcherEventHandlers();
      this.setUpStreamLifeCheck();
      this.m3u8Fetcher.start();
      this.stopAfter(this.getTimeLeft());

      this.setState("recording");
      this.log(`Started with quality: ${JSON.stringify(m3u8.quality)}`);
    } catch (err) {
      this.log(`Can't start: ${err}`);
      this.log("Restart in 1 minute");
      await resolveAfter(60000);
      if (this.state === "starting") this.start();
    } finally {
      this.emit("poststart");
      page && await page.close();
    }
  }

  setUpStreamLifeCheck() {
    Promise.race([
      new Promise((resolve) => this.m3u8Fetcher.once("data", () => resolve())),
      resolveAfter(NO_DATA_TIMEOUT).then(Promise.reject),
    ])
      .then(() => setTimeout(() => this.setUpStreamLifeCheck()))
      .catch(() => {
        if (this.state !== "recording") return;
        this.log(`Stream is offline more than ${NO_DATA_TIMEOUT} ms`);
        this.restart();
      });
  }

  setUpM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.on("data", (chunk) => {
      writeFileSync(this.outputVideoPath, chunk, { flag: "a" });
    });

    this.m3u8Fetcher.on("data", throttle(async (chunk) => {
      writeFileSync(this.dataChunkPath, chunk);
      saveFrame(this.dataChunkPath, this.screenshotPath, { quality: 10 })
        .catch(err => this.log(`Can't take screenshot: ${err}`));
    }, SCREENSHOT_FREQ));

    this.m3u8Fetcher.on("error", () => { });
  }

  removeM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.removeAllListeners("data");
  }

  setState(state) {
    this.state = state;
    this.stateHistory.push({
      state: this.state,
      date: new Date(),
    });
    this.emit("statechange");
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
    const isStarting = this.state === "starting";
    this.setState("stopping");
    this.log("Stopping");
    this.cancelScheduledStop();
    if (isStarting) {
      await new Promise((resolve) =>
        this.once("poststart", resolve)
      );
    }
    if (this.m3u8Fetcher) {
      this.m3u8Fetcher.stop();
      this.removeM3u8FetcherEventHandlers();
    }
    this.setState("stopped");
    this.log("Stopped");
  }

  async restart() {
    this.log("Restarting");
    this.stop();
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

module.exports = StreamRecording;
