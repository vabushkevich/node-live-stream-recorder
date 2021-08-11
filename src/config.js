const { platform } = require('os');

const config = {
  NO_DATA_TIMEOUT: 15 * 1000,
  SCREENSHOT_FREQ: 20 * 1000,
  RETRY_DELAYS: [
    1000,
    10 * 1000,
    2 * 60 * 1000,
    15 * 60 * 1000,
    60 * 60 * 1000,
  ],
}

if (platform() == "win32") {
  config.RECORDINGS_ROOT = "c:/stream-recordings/raw/";
  config.SCREENSHOTS_ROOT = "./site/screenshots/";
  config.BROWSER_PATH = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
} else if (platform() == "linux") {
  config.RECORDINGS_ROOT = "~/raw/";
  config.SCREENSHOTS_ROOT = "./site/screenshots/";
  config.BROWSER_PATH = "/usr/bin/google-chrome";
}

module.exports = config;
