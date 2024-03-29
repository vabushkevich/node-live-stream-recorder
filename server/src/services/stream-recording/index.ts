import path from "path";
import { saveFrame, retry } from "@utils";
import { throttle, pickBy } from "lodash";
import { format as formatDate } from "date-fns";
import sanitizePath from "sanitize-filename";
import { M3u8Fetcher } from "@services/m3u8-fetcher";
import { createStreamPage } from "@services/stream-page";
import { EventEmitter } from "events";
import { mkdirSync } from "fs";
import { nanoid } from "nanoid";
import { Logger } from "@services/logger";
import { RecordingSerialized } from "@types";

import {
  SCREENSHOT_FREQ,
  RECORDINGS_ROOT,
  STATIC_ROOT,
  SCREENSHOTS_ROOT,
  NO_DATA_TIMEOUT,
  LOG_PATH,
} from "@constants";

export class StreamRecording extends EventEmitter {
  id: string;
  url: string;
  state: "idle" | "starting" | "recording" | "stopping" | "stopped";
  targetDuration: number;
  duration: number;
  preferredResolution: number;
  createdDate: Date;
  name: string;
  screenshotPath: string;
  logger: Logger;
  dirPath: string;
  postStartPromise?: Promise<void>;
  postStartCallback?: Function;
  m3u8Url?: string;
  m3u8Fetcher?: M3u8Fetcher;
  resolution?: number;
  screenshotDate?: number;

  constructor(
    url: string,
    {
      duration = 60 * 60 * 1000,
      resolution = 720,
      name = "",
    } = {}
  ) {
    super();
    this.id = nanoid();
    this.url = url;
    this.state = "idle";
    this.targetDuration = duration;
    this.duration = 0;
    this.preferredResolution = resolution;
    this.createdDate = new Date();
    this.screenshotPath = path.join(SCREENSHOTS_ROOT, `${this.id}.jpg`);
    this.name = name.trim().slice(0, 50) || `unnamed-${this.id.slice(0, 4)}`;

    this.logger = new Logger({
      badges: [this.name],
      logPath: LOG_PATH,
    });

    const nameSanitized = sanitizePath(this.name, { replacement: "-" });
    this.dirPath = path.join(
      RECORDINGS_ROOT,
      `${formatDate(this.createdDate, "yyyy-MM-dd HH-mm-ss")} ${nameSanitized}`
    );
    mkdirSync(this.dirPath, { recursive: true });
  }

  update(updaterObj: Partial<StreamRecording>) {
    const state = this.toJSON();
    Object.assign(this, updaterObj);
    const updatedProps = pickBy(this.toJSON(), (v, k: keyof typeof state) => v !== state[k]);
    this.emit("update", updatedProps);
  }

  prolong(duration: number) {
    this.update({ targetDuration: this.targetDuration + duration });
  }

  start() {
    this.update({ state: "starting" });

    retry(
      async () => {
        if (this.state !== "starting") return;

        this.logger.log("Starting");

        this.postStartPromise = new Promise((resolve) => {
          this.postStartCallback = resolve;
        });

        const streamPage = createStreamPage(this.url);
        const stream = await streamPage.getStream(this.preferredResolution);
        this.m3u8Url = stream.url;
        this.update({ resolution: stream.height });

        const outFilePath = path.join(
          this.dirPath,
          `${formatDate(new Date(), "yyyy-MM-dd HH-mm-ss")}.mkv`
        );
        this.m3u8Fetcher = new M3u8Fetcher(
          stream.url,
          outFilePath,
          { timeout: NO_DATA_TIMEOUT }
        );
        this.setUpM3u8FetcherEventHandlers();
        this.m3u8Fetcher.start();
        this.m3u8Fetcher.once("durationearn", () => {
          this.update({ state: "recording" });
          this.logger.log(`Started with resolution: ${this.resolution}p`);
        });
        this.postStartCallback();
      },
      (prevDelay, err) => {
        const delay = Math.min(
          prevDelay == null ? 1000 : prevDelay * 3,
          15 * 60 * 1000
        );
        this.postStartCallback();
        this.logger.log("Can't start:");
        this.logger.log(err);
        this.logger.log(`Restart in ${delay / 1000} s`);
        return delay;
      }
    );
  }

  setUpM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.on("durationearn", (durationEarned) => {
      this.update({ duration: this.duration + durationEarned });
      if (this.getTimeLeft() <= 0) this.stop();
    });

    this.m3u8Fetcher.on("durationearn", throttle(() => {
      saveFrame(this.m3u8Url, this.screenshotPath, { quality: 31 })
        .then(() => {
          this.update({ screenshotDate: Math.floor(Date.now() / 1000) });
        })
        .catch((err) => {
          this.logger.log("Can't take screenshot:");
          this.logger.log(err);
        });
    }, SCREENSHOT_FREQ));

    this.m3u8Fetcher.once("stop", () => {
      this.logger.log("M3u8Fetcher stopped");
      this.restart();
    });
  }

  removeM3u8FetcherEventHandlers() {
    this.m3u8Fetcher.removeAllListeners("durationearn");
    this.m3u8Fetcher.removeAllListeners("stop");
  }

  getTimeLeft() {
    const timeLeft = this.targetDuration - this.duration;
    return timeLeft > 0 ? timeLeft : 0;
  }

  async stop() {
    this.update({ state: "stopping" });
    this.logger.log("Stopping");
    await this.postStartPromise;
    if (this.m3u8Fetcher) {
      this.removeM3u8FetcherEventHandlers();
      this.m3u8Fetcher.stop().catch((err) => {
        this.logger.log("Can't stop m3u8Fetcher:");
        this.logger.log(err);
      });
    }
    this.update({ state: "stopped" });
    this.logger.log("Stopped");
  }

  async restart() {
    if (this.state === "stopping") return;
    this.logger.log("Restarting");
    await this.stop();
    this.start();
  }

  toJSON(): RecordingSerialized {
    return {
      id: this.id,
      url: this.url,
      state: this.state,
      thumbnail: this.screenshotDate && `${path.relative(STATIC_ROOT, this.screenshotPath)}?date=${this.screenshotDate}`,
      createdDate: this.createdDate,
      duration: this.duration,
      targetDuration: this.targetDuration,
      resolution: this.resolution,
    };
  }
}
