const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { resolveIn } = require('lib/utils');

class M3u8Fetcher extends EventEmitter {
  constructor(url, outPath) {
    super();
    this.stopped = true;
    this.url = url;
    this.outPath = outPath;
    this.duration = 0;
  }

  parseDurations(data) {
    const matches = String(data).matchAll(/^frame=.+fps=.+size=.+time=\s*(?<h>\d{2}):(?<m>\d{2}):(?<s>\d{2}).(?<S>\d+)/gm);
    return [...matches].map((match) => {
      const { h, m, s, S } = match.groups;
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

    this.stopped = false;

    this.ffmpeg.stderr.on("data", (data) => {
      for (const duration of this.parseDurations(data)) {
        this.duration = duration;
        this.emit("duration", duration);
      }

      for (const url of this.parseRequests(data)) {
        this.emit("request", url);
      }
    });

    this.ffmpeg.on("exit", () => {
      this.stopped = true;
      this.emit("stop");
    });
  }

  async stop() {
    if (this.stopped) return;
    const exitPromise = new Promise((resolve) => this.ffmpeg.once("exit", resolve));
    for (const signal of ["SIGTERM", "SIGKILL"]) {
      this.ffmpeg.kill(signal);
      const terminated = await Promise.race([
        exitPromise.then(() => true),
        resolveIn(5000).then(() => false)
      ]);
      if (terminated) break;
      this.emit("error", `Can't kill ffmpeg process using ${signal}`);
    }
  }
}

module.exports = M3u8Fetcher;
