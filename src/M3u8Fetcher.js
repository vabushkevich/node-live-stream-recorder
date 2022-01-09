const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { resolveIn } = require('lib/utils');
const { last } = require('lodash');

class M3u8Fetcher extends EventEmitter {
  constructor(url, outPath) {
    super();
    this.stopped = false;
    this.url = url;
    this.outPath = outPath;
    this.duration = 0;
    this.emitter = new EventEmitter();

    this.emitter.on("request", (e) => this.emit("request", e));
    this.emitter.on("duration", (e) => this.emit("duration", e));
    this.emitter.on("durationearn", (e) => this.emit("durationearn", e));
    this.emitter.on("error", (e) => this.emit("error", e));
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
          this.emitter.emit("durationearn", duration - this.duration);
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
      this.emitter.emit("stop");
    });
  }

  async stop() {
    if (this.stopped) return;
    for (const signal of ["SIGTERM", "SIGKILL"]) {
      this.ffmpeg.kill(signal);
      const terminated = await Promise.race([
        this.exitPromise.then(() => true),
        resolveIn(5000).then(() => false)
      ]);
      if (terminated) return;
      this.emitter.emit("error", `Can't kill ffmpeg process using ${signal}`);
    }
  }
}

module.exports = M3u8Fetcher;
