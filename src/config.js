require('dotenv').config();

const config = {
  NO_DATA_TIMEOUT: 30 * 1000,
  SCREENSHOT_FREQ: 20 * 1000,
  MAX_OPEN_PAGES: 5,
  FETCH_HEADERS: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
  },
  SCREENSHOTS_ROOT: "./site/screenshots/",
  LOG_PATH: "./server.log",
  RECORDINGS_ROOT: process.env.RECORDINGS_ROOT,
  BROWSER_PATH: process.env.BROWSER_PATH,
}

if (!config.RECORDINGS_ROOT) {
  throw new Error("Env var RECORDINGS_ROOT must be set");
}

if (!config.BROWSER_PATH) {
  throw new Error("Env var BROWSER_PATH must be set");
}

module.exports = config;
