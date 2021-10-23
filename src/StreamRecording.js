const { writeFile } = require('fs').promises;
const { mkdtempSync, mkdirSync } = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { saveFrame, resolveAfter, retry, getDuration, addToAverage } = require('lib/utils');
const { throttle } = require('lodash');
const { format: formatDate } = require('date-fns');
const sanitizePath = require("sanitize-filename");
const M3u8Fetcher = require("lib/M3u8Fetcher");
const { createStreamPage } = require('lib/stream-page');
const { EventEmitter } = require('events');

const {
  SCREENSHOT_FREQ,
  RECORDINGS_ROOT,
  SCREENSHOTS_ROOT,
  NO_DATA_TIMEOUT,
  ESTIMATE_CHUNK_LENGTH_EVERY_MS,
} = require('lib/config');

class StreamRecording extends EventEmitter {
  constructor(
    url,
    {
      duration = 60 * 60 * 1000,
      quality = { height: 400 },
      nameSuffix = "",
      id,
    } = {}
  ) {
    super();
    if (!id) throw new Error("Recording id must be specified");
    this.id = id;
    this.url = url;
    this.duration = duration;
    this.chunksGot = 0;
    this.chunkLengthEstimations = 0;
    this.averageChunkLength = 0;
    this.quality = quality;
    this.nameSuffix = sanitizePath(nameSuffix, { replacement: "-" }).trim();
    this.createdDate = new Date();
    this.name = this.buildName().trim();
    this.tmpDir = mkdtempSync(path.join(tmpdir(), "stream-recording-"));
    this.outDirPath = path.join(RECORDINGS_ROOT, this.name);
    mkdirSync(this.outDirPath);
    this.screenshotPath = path.join(SCREENSHOTS_ROOT, `${this.id}.jpg`);
    this.dataChunkPath = path.join(this.tmpDir, this.name);
    this.stateHistory = [];
    this.setState("idle");
  }

  buildName() {
    return `${formatDate(this.createdDate, "yyyy-MM-dd HH-mm-ss")} ${this.nameSuffix}`;
  }

  log(message) {
    const dateStr = formatDate(new Date(), "d MMM, HH:mm:ss");
    console.log(`[${dateStr}] ${this.nameSuffix}: ${String(message).replace("\n", "")}`);
  }

  stopAfter(duration) {
    this.cancelScheduledStop();
    this.stopTimeout = setTimeout(() => this.stop(), duration);
  }

  cancelScheduledStop() {
    clearTimeout(this.stopTimeout);
  }

  prolong(duration) {
    this.duration += duration;
    if (this.state == "recording") {
      this.stopAfter(this.getTimeLeft());
    }
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
          resolveAfter(NO_DATA_TIMEOUT)
            .then(() => Promise.reject(new Error("Timeout while getting a stream")))
        ]);

        this.m3u8Fetcher = new M3u8Fetcher(stream.url);
        this.setUpM3u8FetcherEventHandlers();
        this.setUpStreamLifeCheck();
        this.m3u8Fetcher.start();
        this.stopAfter(this.getTimeLeft());
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
      this.chunksGot += 1;
      const fileStem = String(this.chunksGot).padStart(6, "0");
      writeFile(path.join(this.outDirPath, `${fileStem}${chunk.ext}`), chunk.buffer);
    });

    this.m3u8Fetcher.on("data", throttle(async (chunk) => {
      await writeFile(this.dataChunkPath, chunk.buffer);
      saveFrame(this.dataChunkPath, this.screenshotPath, { quality: 31 })
        .catch(err => this.log(`Can't take screenshot: ${err}`));
    }, SCREENSHOT_FREQ));

    this.m3u8Fetcher.on("data", throttle(() => {
      getDuration(this.dataChunkPath)
        .then((duration) => {
          this.averageChunkLength = addToAverage(
            this.averageChunkLength,
            duration,
            this.chunkLengthEstimations
          );
          this.chunkLengthEstimations += 1;
        })
        .catch((err) => this.log(err));
    }, ESTIMATE_CHUNK_LENGTH_EVERY_MS));

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

  getRecordedDuration() {
    return this.chunksGot * this.averageChunkLength;
  }

  getTimeLeft() {
    if (this.state == "stopped") {
      return 0;
    }
    return this.duration - this.getRecordedDuration();
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
      quality: this.actualQuality,
    };
  }
}

module.exports = StreamRecording;
