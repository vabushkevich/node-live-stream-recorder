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
 * Four values passed in `callback`: `err`, `res`, `nextDelay`.
 *
 * @function module:utils.retry
 * @param {Function} func The function to execute.
 * @param {*} retryDelays The iterable containing delays before each retry.
 * @param {Function} callback The callback that executes when `func` executes
 * successfully or when last `func`'s call failed.
 * @returns {Promise} The promise that resolves with `func`'s returned value or
 * rejects with a error thrown during last unsuccessful `func` execution.
 */
async function retry(func, retryDelays, callback) {
  const iterFunc = retryDelays[Symbol.iterator] || retryDelays[Symbol.asyncIterator];
  const iter = iterFunc.call(retryDelays);
  while (true) {
    const nextDelay = (await iter.next()).value;
    try {
      const res = await func();
      callback(undefined, res);
      return res;
    } catch (err) {
      callback(err, undefined, nextDelay);
      if (nextDelay != null) {
        await resolveIn(nextDelay);
      } else {
        throw err;
      }
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
