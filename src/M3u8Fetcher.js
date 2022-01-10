const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { resolveIn } = require('lib/utils');
const { last } = require('lodash');

class M3u8Fetcher extends EventEmitter {
  constructor(url, outPath, { timeout = 30000 } = {}) {
    super();
    this.stopped = false;
    this.finished = false;
    this.url = url;
    this.outPath = outPath;
    this.duration = 0;
    this.emitter = new EventEmitter();
    this.timeout = timeout;

    this.emitter.on("request", (e) => this.emit("request", e));
    this.emitter.on("duration", (e) => this.emit("duration", e));
    this.emitter.on("durationearn", (e) => this.emit("durationearn", e));
    this.emitter.on("stop", () => this.emit("stop"));
  }

  parseDurations(data) {
    const matches = String(data).matchAll(/^frame=.+fps=.+size=.+time=\s*(?<h>\d{2}):(?<m>\d{2}):(?<s>\d{2})(\.(?<S>\d+))?/gm);
    return [...matches].map((match) => {
      const { h, m, s, S = 0 } = match.groups;
      const duration = (h * 60 * 60 + m * 60 + +s) * 1000 + +S;
      return duration;
    });
  }

  parseRequests(data) {
    const matches = String(data).matchAll(/^\[http.+Opening '(.+)' for reading/gm);
    const urls = [...matches].map((match) => match[1]);
    return urls;
  }

  start() {
    if (this.finished) {
      throw new Error("The m3u8Fetcher can't be started after it's stopped");
    }

    this.ffmpeg = spawn(
      "ffmpeg",
      ["-y", "-i", this.url, "-c", "copy", this.outPath]
    );

    this.exitPromise = new Promise((resolve) => this.ffmpeg.once("exit", resolve));

    this.ffmpeg.stderr.on("data", (data) => {
      const duration = last(this.parseDurations(data));
      if (duration) {
        const durationEarned = duration - this.duration;
        if (durationEarned > 0) {
          this.emitter.emit("durationearn", durationEarned);
        }
        this.duration = duration;
        this.emitter.emit("duration", duration);
      }

      for (const url of this.parseRequests(data)) {
        this.emitter.emit("request", url);
      }
    });

    this.ffmpeg.on("exit", () => {
      this.stopped = true;
      this.finished = true;
      this.emitter.emit("stop");
    });

    this.startPinging();
  }

  async stop() {
    if (this.finished) return;
    this.finished = true;
    for (const signal of ["SIGTERM", "SIGKILL"]) {
      this.ffmpeg.kill(signal);
      const terminated = await Promise.race([
        this.exitPromise.then(() => true),
        resolveIn(5000).then(() => false)
      ]);
      if (!terminated && signal == "SIGKILL") {
        throw new Error("Can't kill ffmpeg process with SIGKILL");
      }
    }
  }

  async ping() {
    await Promise.race([
      new Promise((resolve) => this.emitter.once("durationearn", resolve)),
      resolveIn(this.timeout).then(Promise.reject),
    ]);
  }

  async startPinging() {
    while (!this.finished) {
      await this.ping().catch(() => this.stop());
    }
  }
}

module.exports = M3u8Fetcher;
