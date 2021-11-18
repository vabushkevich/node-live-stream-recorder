const path = require('path');
const { saveFrame, resolveIn, retry } = require('lib/utils');
const { throttle } = require('lodash');
const { format: formatDate } = require('date-fns');
const sanitizePath = require("sanitize-filename");
const M3u8Fetcher = require("lib/M3u8Fetcher");
const { createStreamPage } = require('lib/stream-page');
const { EventEmitter } = require('events');
const { mkdirSync } = require('fs');

const {
  SCREENSHOT_FREQ,
  RECORDINGS_ROOT,
  SCREENSHOTS_ROOT,
  NO_DATA_TIMEOUT,
} = require('lib/config');

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
    this.recordedDuration = 0;
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

  log(message) {
    const dateStr = formatDate(new Date(), "d MMM, HH:mm:ss");
    console.log(`[${dateStr}] ${this.nameSuffix}: ${String(message).replace("\n", "")}`);
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

        const streamPage = createStreamPage(this.url);
        await streamPage.getQuota();
        const stream = await Promise.race([
          streamPage.getStream(this.quality),
          resolveIn(NO_DATA_TIMEOUT)
            .then(() => Promise.reject(new Error("Timeout while getting a stream")))
        ]);

        const fileStem = this.buildName(new Date());
        this.outFilePath = path.join(RECORDINGS_ROOT, this.name, `${fileStem}.mkv`);

        this.m3u8Fetcher = new M3u8Fetcher(stream.url, this.outFilePath);
        this.setUpM3u8FetcherEventHandlers();
        this.setUpStreamLifeCheck();
        this.m3u8Fetcher.start();
        this.actualQuality = { resolution: stream.height };

        this.setState("recording");
        this.log(`Started with quality: ${JSON.stringify(this.actualQuality)}`);
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
        this.emit("poststart");
        if (!err) return;
        this.log(`Can't start: ${err}`);
        if (nextDelay != null) {
          this.log(`Restart in ${nextDelay / 1000} s`);
        }
      }
    )
      .catch(() => {
        if (this.state === "starting") {
          this.setState("stopped");
          this.log("Stopped");
        }
      });
  }

  setUpStreamLifeCheck() {
    Promise.race([
      new Promise((resolve) => this.m3u8Fetcher.once("request", () => resolve())),
      resolveIn(NO_DATA_TIMEOUT).then(Promise.reject),
    ])
      .then(() => setTimeout(() => this.setUpStreamLifeCheck()))
      .catch(() => {
        if (this.state !== "recording") return;
        this.log(`Stream is offline more than ${NO_DATA_TIMEOUT} ms`);
        this.restart();
      });
  }

  setUpM3u8FetcherEventHandlers() {
    let lastDuration = 0;

    this.m3u8Fetcher.on("duration", (duration) => {
      this.recordedDuration += duration - lastDuration;
      lastDuration = duration;
      if (this.getTimeLeft() <= 0) this.stop();
    });

    this.m3u8Fetcher.on("duration", throttle(() => {
      saveFrame(
        this.outFilePath,
        this.screenshotPath,
        {
          position: `${this.recordedDuration - 2000}ms`,
          quality: 31,
        }
      )
        .catch((err) => {
          this.log("Can't take screenshot:");
          console.log(err);
        });
    }, SCREENSHOT_FREQ));

    this.m3u8Fetcher.once("stop", () => {
      if (this.state !== "recording") return;
      this.log("M3u8Fetcher stopped on its own");
      this.restart();
    });
  }

  removeM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.removeAllListeners("request");
    this.m3u8Fetcher.removeAllListeners("duration");
  }

  setState(state) {
    this.state = state;
  }

  getTimeLeft() {
    const timeLeft = this.targetDuration - this.recordedDuration;
    return timeLeft > 0 ? timeLeft : 0;
  }

  async stop() {
    const isStarting = this.state === "starting";
    this.setState("stopping");
    this.log("Stopping");
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
      quality: this.actualQuality,
    };
  }
}

module.exports = StreamRecording;
