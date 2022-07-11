import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

export const NO_DATA_TIMEOUT = 30 * 1000;
export const SCREENSHOT_FREQ = 15 * 1000;
export const MAX_OPEN_PAGES = 5;
export const FETCH_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
};
export const STATIC_ROOT = path.join(__dirname, "..", "..", "client", "build");
export const SCREENSHOTS_ROOT = path.join(STATIC_ROOT, "screenshots");
export const LOG_PATH = process.env.LOG_PATH;
export const RECORDINGS_ROOT = process.env.RECORDINGS_ROOT;
export const BROWSER_PATH = process.env.BROWSER_PATH;
export const SERVER_PORT = process.env.SERVER_PORT || 5370;

if (!RECORDINGS_ROOT) {
  throw new Error("Env var RECORDINGS_ROOT must be set");
}

if (!BROWSER_PATH) {
  throw new Error("Env var BROWSER_PATH must be set");
}
