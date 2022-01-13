const { getBrowser } = require('lib/browser');
const { resolveIn, parseM3u8 } = require('lib/utils');
const fetch = require('node-fetch');

const {
  MAX_OPEN_PAGES,
  NO_DATA_TIMEOUT,
  FETCH_HEADERS,
} = require('lib/config');

class StreamPage {
  constructor(url) {
    this.url = url;
    this.page = null;
    this.closed = true;
  }

  async getStream(quality) {
    await this.getQuota();
    const m3u8Url = await Promise.race([
      this.getM3u8Url(),
      resolveIn(NO_DATA_TIMEOUT).then(() => Promise.reject(new Error("Timeout while getting a playlist url")))
    ])
      .finally(() => {
        if (!this.closed) this.close();
        StreamPage.resolveNextQuotaReq();
      });
    const m3u8 = await fetch(m3u8Url, { headers: FETCH_HEADERS })
      .then((res) => res.text());
    const { streams } = parseM3u8(m3u8, m3u8Url);
    const stream = this.findStream(streams, quality);
    return stream;
  }

  async open() {
    const browser = await getBrowser();
    const page = this.page || (this.page = await browser.newPage());
    this.closed = false;
    await page.goto(this.url, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      document.documentElement.style.setProperty("display", "none", "important");
    });
    return page;
  }

  close() {
    if (this.page && !this.closed) {
      this.page.close().catch(() => { });
      this.closed = true;
    }
  }

  findStream(streams, target) {
    const key = Object.keys(target)[0];
    const distances = streams.map((stream) =>
      ({ [key]: Math.abs(stream[key] - target[key]) })
    );
    const minDistance = [...distances].sort((a, b) => a[key] - b[key])[0];
    const i = distances.indexOf(minDistance)
    return streams[i];
  }

  async getQuota() {
    const browser = await getBrowser();
    if (browser.contexts().length == 0) return;
    const pagesOpen = (await browsercontexts()[0].pages()).length - 1;
    if (pagesOpen < MAX_OPEN_PAGES) return;
    return new Promise((resolve) =>
      StreamPage.quotaRequests.push(resolve)
    );
  }
}

StreamPage.quotaRequests = [];

StreamPage.resolveNextQuotaReq = () => {
  if (StreamPage.quotaRequests.length > 0) {
    const quotaResolver = StreamPage.quotaRequests.shift();
    quotaResolver();
  }
}

module.exports = StreamPage;
