const { exec } = require('child_process');

function isVideoData(res) {
  const contentType = res.headers()["content-type"];
  if (contentType && contentType.includes("video")) return true;
  return false;
}

function isMpegUrlData(res) {
  const contentType = res.headers()["content-type"];
  if (contentType && contentType.includes("mpegurl")) return true;
  return false;
}

function saveFrame(path, imagePath, {
  position = "00:00",
  quality,
}) {
  const seekFlag = position[0] == "-" ? "-sseof" : "-ss";
  const qualityParam = isNaN(quality) ? "" : `-qscale:v ${+quality}`;

  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -v error ${seekFlag} ${position} -i "${path}" -frames 1 ${qualityParam} -y "${imagePath}"`,
      { timeout: 1000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr.trim()));
        } else {
          resolve();
        }
      }
    );
  });
}

function resolveAfter(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseM3u8(m3u8, baseUrl) {
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
      if (baseUrl) stream.url = new URL(name, baseUrl).href;
      return stream;
    });
  return { chunkNames, streams };
}

function isSimilarObjects(obj1, obj2) {
  const propNames1 = Object.getOwnPropertyNames(obj1);
  const propNames2 = Object.getOwnPropertyNames(obj2);
  if (propNames1.length != propNames2.length) return false;
  for (const propName of propNames1) {
    if (obj1[propName] !== obj2[propName]) return false;
  }
  return true;
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
        await resolveAfter(nextDelay);
      } else {
        throw err;
      }
    }
  }
}

function getDuration(path) {
  return new Promise((resolve, reject) => {
    exec(
      `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${path}"`,
      { timeout: 1000 },
      (err, stdout, stderr) => {
        if (err || stderr.trim()) {
          reject(new Error(`ffprobe command failed: ${stderr.trim()}`));
        } else if (!stdout.trim() || isNaN(stdout)) {
          reject(new Error(`ffprobe can't get duration. Got: ${stdout.trim()}`));
        } else {
          resolve(stdout * 1000);
        }
      }
    );
  });
}

function addToAverage(average, value, i) {
  return average * i / (i + 1) + value / (i + 1);
}

module.exports = {
  isVideoData,
  saveFrame,
  resolveAfter,
  isMpegUrlData,
  parseM3u8,
  isSimilarObjects,
  retry,
  getDuration,
  addToAverage,
};
