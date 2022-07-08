const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const NO_DATA_TIMEOUT = 30 * 1000;
const SCREENSHOT_FREQ = 15 * 1000;
const MAX_OPEN_PAGES = 5;
const FETCH_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
};
const STATIC_ROOT = path.join(__dirname, "..", "..", "client", "build");
const SCREENSHOTS_ROOT = path.join(STATIC_ROOT, "screenshots");
const LOG_PATH = process.env.LOG_PATH;
const RECORDINGS_ROOT = process.env.RECORDINGS_ROOT;
const BROWSER_PATH = process.env.BROWSER_PATH;
const SERVER_PORT = process.env.SERVER_PORT || 5370;

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
  STATIC_ROOT,
  SCREENSHOTS_ROOT,
  LOG_PATH,
  RECORDINGS_ROOT,
  BROWSER_PATH,
  SERVER_PORT,
};
