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

function parseM3u8(m3u8) {
  const chunkNames = [...m3u8.matchAll(/(?:#EXTINF.*\n)(.+)/ig)]
    .map((match) => match[1]);
  return { chunkNames };
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

module.exports = {
  isVideoData,
  saveFrame,
  resolveAfter,
  isMpegUrlData,
  parseM3u8,
  isSimilarObjects,
};
