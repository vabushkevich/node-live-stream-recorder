const { platform } = require('os');

const config = {
  NO_DATA_TIMEOUT: 30 * 1000,
  SCREENSHOT_FREQ: 20 * 1000,
  MAX_OPEN_PAGES: 5,
  FETCH_HEADERS: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
  },
  SCREENSHOTS_ROOT: "./site/screenshots/",
  LOG_PATH: "./server.log",
}

if (platform() == "win32") {
  config.RECORDINGS_ROOT = "c:/stream-recordings/";
  config.BROWSER_PATH = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
} else if (platform() == "linux") {
  config.RECORDINGS_ROOT = "~/stream-recordings/";
  config.BROWSER_PATH = "/usr/bin/google-chrome";
}

module.exports = config;
