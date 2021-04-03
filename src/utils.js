const { exec } = require('child_process');

class NoVideoTimeoutError extends Error {
  constructor() {
    super(...arguments);
    this.name = "NoVideoTimeoutError";
  }
}

function isVideoData(res) {
  const contentType = res.headers()["content-type"];
  if (contentType && contentType.includes("video")) return true;
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

module.exports = {
  NoVideoTimeoutError,
  isVideoData,
  saveFrame,
  resolveAfter,
};
