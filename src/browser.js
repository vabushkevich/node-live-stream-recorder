const { chromium } = require('playwright-core');

const { BROWSER_PATH } = require('lib/constants');

let browser;

module.exports.getBrowser = () => {
  return browser || (browser = chromium.launch({
    executablePath: BROWSER_PATH,
  }));
}
