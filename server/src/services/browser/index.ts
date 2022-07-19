import { chromium, Browser } from "playwright-core";

import { BROWSER_PATH } from "@constants";

let browser: Promise<Browser>;

export const getBrowser = () => {
  return browser || (browser = chromium.launch({
    executablePath: BROWSER_PATH,
  }));
}
