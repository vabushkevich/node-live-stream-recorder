const { getBrowser } = require('server/browser');
const { resolveIn, parseM3u8, findClosest } = require('server/utils');
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
    const stream = findClosest(streams, (stream) =>
      1 / (1 + Math.abs(quality.height - stream.height))
    );
    return stream;
  }

  async open() {
    const browser = await getBrowser();
    this.page = await browser.newPage();
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    await this.page.evaluate(() => {
      document.documentElement.style.setProperty("display", "none", "important");
    });
    return this.page;
  }

  close() {
    if (this.page && !this.page.isClosed()) {
      this.page.close().catch(() => { });
    }
  }
}

module.exports = StreamPage;
