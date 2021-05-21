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

function saveFrame(videoPath, imagePath, position = "00:00") {
  const seekFlag = position[0] == "-" ? "-sseof" : "-ss";

  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg ${seekFlag} ${position} -i "${videoPath}" -frames 1 -qscale:v 31 -y "${imagePath}"`,
      { timeout: 5000 },
      err => {
        if (err) {
          reject(new Error("ffmpeg command failed"));
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
