const { platform } = require('os');

const config = {
  NO_DATA_TIMEOUT: 30 * 1000,
  SCREENSHOT_FREQ: 20 * 1000,
  ESTIMATE_CHUNK_LENGTH_EVERY_MS: 10000,
  MAX_OPEN_PAGES: 5,
  MAX_CHUNK_DURATION: 10000,
}

if (platform() == "win32") {
  config.RECORDINGS_ROOT = "c:/stream-recordings/";
  config.SCREENSHOTS_ROOT = "./site/screenshots/";
  config.BROWSER_PATH = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
} else if (platform() == "linux") {
  config.RECORDINGS_ROOT = "~/stream-recordings/";
  config.SCREENSHOTS_ROOT = "./site/screenshots/";
  config.BROWSER_PATH = "/usr/bin/google-chrome";
}

module.exports = config;
