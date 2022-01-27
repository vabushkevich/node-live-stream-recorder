require('dotenv').config();

const NO_DATA_TIMEOUT = 30 * 1000;
const SCREENSHOT_FREQ = 20 * 1000;
const MAX_OPEN_PAGES = 5;
const FETCH_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
};
const SCREENSHOTS_ROOT = "./client/screenshots/";
const LOG_PATH = "./server.log";
const RECORDINGS_ROOT = process.env.RECORDINGS_ROOT;
const BROWSER_PATH = process.env.BROWSER_PATH;

if (!RECORDINGS_ROOT) {
  throw new Error("Env var RECORDINGS_ROOT must be set");
}

if (!BROWSER_PATH) {
  throw new Error("Env var BROWSER_PATH must be set");
}

module.exports = {
  NO_DATA_TIMEOUT,
  SCREENSHOT_FREQ,
  MAX_OPEN_PAGES,
  FETCH_HEADERS,
  SCREENSHOTS_ROOT,
  LOG_PATH,
  RECORDINGS_ROOT,
  BROWSER_PATH,
};
