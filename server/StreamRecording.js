const path = require('path');
const { saveFrame, retry } = require('server/utils');
const { throttle } = require('lodash');
const { format: formatDate } = require('date-fns');
const sanitizePath = require("sanitize-filename");
const M3u8Fetcher = require("server/M3u8Fetcher");
const { createStreamPage } = require('server/stream-page');
const { EventEmitter } = require('events');
const { mkdirSync, appendFileSync } = require('fs');

const {
  SCREENSHOT_FREQ,
  RECORDINGS_ROOT,
  SCREENSHOTS_ROOT,
  NO_DATA_TIMEOUT,
  LOG_PATH,
} = require('server/constants');

class StreamRecording extends EventEmitter {
  constructor(
    url,
    {
      targetDuration = 60 * 60 * 1000,
      quality = { height: 400 },
      nameSuffix = "",
      id,
    } = {}
  ) {
    super();
    if (!id) throw new Error("Recording id must be specified");
    this.id = id;
    this.url = url;
    this.targetDuration = targetDuration;
    this.duration = 0;
    this.quality = quality;
    this.nameSuffix = sanitizePath(nameSuffix, { replacement: "-" }).trim();
    this.createdDate = new Date();
    this.name = this.buildName(this.createdDate);
    this.screenshotPath = path.join(SCREENSHOTS_ROOT, `${this.id}.jpg`);
    this.setState("idle");
    mkdirSync(path.join(RECORDINGS_ROOT, this.name));
  }

  buildName(date = new Date()) {
    return `${formatDate(date, "yyyy-MM-dd HH-mm-ss")} ${this.nameSuffix}`.trim();
  }

  log(...messages) {
    const dateStr = formatDate(new Date(), "d MMM, HH:mm:ss");
    const prefix = `[${dateStr}] ${this.nameSuffix}:`;
    const out = messages.reduce((res, message, i) => {
      let messageStr;
      if (message instanceof Error) {
        messageStr = message.stack;
      } else if (message && typeof message == "object") {
        messageStr = JSON.stringify(message);
      } else {
        messageStr = message;
      }
      res += (i > 0 ? "\n" : " ");
      res += messageStr;
      return res;
    }, prefix);
    console.log(out);
    appendFileSync(LOG_PATH, `${out}\n`);
  }

  prolong(duration) {
    this.targetDuration += duration;
  }

  async start() {
    this.setState("starting");

    await retry(
      async () => {
        if (this.state !== "starting") return;

        this.log("Starting");

        this.postStartPromise = new Promise((resolve) => {
          this.postStartCallback = resolve;
        });

        const streamPage = createStreamPage(this.url);
        const stream = await streamPage.getStream(this.quality);
        this.m3u8Url = stream.url;
        this.actualQuality = { resolution: stream.height };

        const fileStem = this.buildName(new Date());
        const outFilePath = path.join(RECORDINGS_ROOT, this.name, `${fileStem}.mkv`);

        this.m3u8Fetcher = new M3u8Fetcher(
          stream.url,
          outFilePath,
          { timeout: NO_DATA_TIMEOUT }
        );
        this.setUpM3u8FetcherEventHandlers();
        this.m3u8Fetcher.start();
        this.m3u8Fetcher.once("durationearn", () => {
          this.setState("recording");
          this.log(`Started with quality: ${JSON.stringify(this.actualQuality)}`);
        });
      },
      function* () {
        yield* new Array(3).fill(1000);
        yield 1 * 60 * 1000;
        yield 2 * 60 * 1000;
        yield 5 * 60 * 1000;
        yield* new Array(6).fill(10 * 60 * 1000);
        while (true) {
          yield 20 * 60 * 1000;
        }
      }(),
      (err, res, nextDelay) => {
        this.postStartCallback();
        if (!err) return;
        this.log("Can't start:", err);
        if (nextDelay != null) {
          this.log(`Restart in ${nextDelay / 1000} s`);
        }
      }
    );
  }

  setUpM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.on("durationearn", (durationEarned) => {
      this.duration += durationEarned;
      if (this.getTimeLeft() <= 0) this.stop();
    });

    this.m3u8Fetcher.on("durationearn", throttle(() => {
      saveFrame(this.m3u8Url, this.screenshotPath, { quality: 31 })
        .catch(err => this.log("Can't take screenshot:", err));
    }, SCREENSHOT_FREQ));

    this.m3u8Fetcher.once("stop", () => {
      this.log("M3u8Fetcher stopped");
      this.restart();
    });
  }

  removeM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.removeAllListeners("durationearn");
    this.m3u8Fetcher.removeAllListeners("stop");
  }

  setState(state) {
    this.state = state;
  }

  getTimeLeft() {
    const timeLeft = this.targetDuration - this.duration;
    return timeLeft > 0 ? timeLeft : 0;
  }

  async stop() {
    this.setState("stopping");
    this.log("Stopping");
    await this.postStartPromise;
    if (this.m3u8Fetcher) {
      this.removeM3u8FetcherEventHandlers();
      this.m3u8Fetcher.stop().catch((err) => {
        this.log("Can't stop m3u8Fetcher:", err);
      });
    }
    this.setState("stopped");
    this.log("Stopped");
  }

  async restart() {
    if (this.state === "stopping") return;
    this.log("Restarting");
    await this.stop();
    await this.start();
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      state: this.state,
      screenshotPath: path.relative("./client", this.screenshotPath),
      createdDate: this.createdDate,
      timeLeft: this.getTimeLeft(),
      quality: this.actualQuality,
    };
  }
}

module.exports = StreamRecording;
