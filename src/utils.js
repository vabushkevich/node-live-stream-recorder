const { format } = require('date-fns');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');

let browser;

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

function formatDate(date) {
  return `${format(date, "yyyyMMddHHmmss")}${date.getMilliseconds().toString().padStart(3, "0")}`;
}

function startInterval(callback, ms) {
  callback();
  return setInterval(callback, ms);
}

function saveLastFrame(videoPath, imagePath) {
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -sseof -1 -i ${videoPath} -vframes 1 -qscale:v 31 -y ${imagePath}`,
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

function getBrowser() {
  browser = browser || puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    // headless: false,
    // defaultViewport: {
    //   width: 1920,
    //   height: 1080,
    // },
    // userDataDir: "C:\\Users\\User\\AppData\\Local\\Google\\Chrome\\User Data",
  });
  return browser;
}

module.exports = {
  NoVideoTimeoutError,
  isVideoData,
  formatDate,
  startInterval,
  saveLastFrame,
  resolveAfter,
  getBrowser,
};
