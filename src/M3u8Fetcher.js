const { EventEmitter } = require('events');
const { spawn } = require('child_process');

class M3u8Fetcher extends EventEmitter {
  constructor(url, outPath) {
    super();
    this.stopped = true;
    this.url = url;
    this.outPath = outPath;
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

  stop() {
    if (this.stopped) return;
    this.ffmpeg.kill();
  }
}

module.exports = M3u8Fetcher;
