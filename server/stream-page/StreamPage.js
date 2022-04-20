const { getBrowser } = require('server/browser');
const { resolveIn, parseM3u8 } = require('server/utils');
const fetch = require('node-fetch');
const QuotaAllocator = require('server/QuotaAllocator');

const {
  MAX_OPEN_PAGES,
  NO_DATA_TIMEOUT,
  FETCH_HEADERS,
} = require('server/constants');

const pageQuotaAllocator = new QuotaAllocator(MAX_OPEN_PAGES);

class StreamPage {
  constructor(url) {
    this.url = url;
    this.page = null;
  }

  async getStream(quality) {
    const pageQuota = await pageQuotaAllocator.request();
    const m3u8Url = await Promise.race([
      this.getM3u8Url(),
      resolveIn(NO_DATA_TIMEOUT).then(() => Promise.reject(new Error("Timeout while getting a playlist url")))
    ])
      .finally(() => {
        this.close();
        pageQuota.release();
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
    await page.goto(this.url, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      document.documentElement.style.setProperty("display", "none", "important");
    });
    return page;
  }

  close() {
    if (this.page && !this.page.isClosed()) {
      this.page.close().catch(() => { });
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
}

module.exports = StreamPage;
