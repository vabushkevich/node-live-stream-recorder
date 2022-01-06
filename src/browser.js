const puppeteer = require('puppeteer-core');

const { BROWSER_PATH } = require('lib/config');

let browser;

module.exports.getBrowser = () => {
  return browser || (browser = puppeteer.launch({
    executablePath: BROWSER_PATH,
  }));
}
