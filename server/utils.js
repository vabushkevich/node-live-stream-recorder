const { exec } = require('child_process');

function isMpegUrlData(res) {
  const contentType = res.headers()["content-type"];
  if (contentType && contentType.includes("mpegurl")) return true;
  return false;
}

function saveFrame(inPath, outPath, {
  position,
  quality,
} = {}) {
  let seekParam = "";
  const qualityParam = isNaN(quality) ? "" : `-q ${+quality}`;

  if (position) {
    seekParam = (position[0] == "-" ? "-sseof " : "-ss ") + position;
  }

  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -v error ${seekParam} -i "${inPath}" -frames 1 ${qualityParam} "${outPath}"`,
      { timeout: 3000 },
      (err, stdout, stderr) => {
        if (err) return reject(err);
        if (stderr.trim()) return reject(new Error(stderr.trim()));
        resolve();
      }
    );
  });
}

function resolveIn(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseM3u8(m3u8, url) {
  const chunkNames = [...m3u8.matchAll(/(?:#EXTINF.*\n)(.+)/ig)]
    .map((match) => match[1]);
  const streams = [...m3u8.matchAll(/(^#EXT-X-STREAM-INF:.+)\n(.+)/gm)]
    .map(([, meta, name]) => {
      const stream = {};
      stream.name = name;
      stream.bandwidth = +meta.match(/(?<=BANDWIDTH=)\d+/)[0];
      stream.resolution = meta.match(/(?<=RESOLUTION=)\d+x\d+/)[0];
      stream.width = +stream.resolution.match(/(\d+)x(\d+)/)[1];
      stream.height = +stream.resolution.match(/(\d+)x(\d+)/)[2];
      if (isValidUrl(name)) {
        stream.url = name;
      } else if (isValidUrl(url)) {
        stream.url = new URL(name, url).href;
      }
      return stream;
    });
  return { chunkNames, streams };
}

/**
 * Retry `func` execution until it returns a value or a promise that resolves.
 * The values passed in `delayReducer`: `prevDelay`, `err`.
 *
 * @param {Function} func The function to execute.
 * @param {Function} delayReducer The function that should return the next delay
 * based on the previous delay. If the function returns `null` or `undefined`,
 * there will be no future `func` calls. During the first call `prevDelay`
 * equals `null`.
 * @returns {Promise} The promise that resolves with `func`'s returned value or
 * rejects with a error thrown during last unsuccessful `func` execution.
 */
async function retry(func, delayReducer) {
  let prevDelay = null;
  while (true) {
    try {
      return await func();
    } catch (err) {
      const delay = delayReducer(prevDelay, err);
      if (delay == null) throw err;
      await resolveIn(delay);
      prevDelay = delay;
    }
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  saveFrame,
  resolveIn,
  isMpegUrlData,
  parseM3u8,
  retry,
};
