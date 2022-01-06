const { getBrowser } = require('lib/browser');

const {
  MAX_OPEN_PAGES,
} = require('lib/config');

class StreamPage {
  constructor(url) {
    this.url = url;
  }

  async getStream(quality) {
    const browser = await getBrowser();
    this.page = await browser.newPage();
    const [streams] = await Promise.all([
      this.getStreams(),
      (async () => {
        await this.page.goto(this.url)
          .catch((err) => {
            if (err.name == "TimeoutError") {
              throw new Error("Page open timeout");
            }
            throw err;
          });
        await this.page.evaluate(() =>
          document.documentElement.style.display = "none !important"
        );
      })()
    ])
      .finally(async () => {
        await this.page.close().catch(() => { });
        StreamPage.resolveNextQuotaReq();
      });

    const stream = this.findStream(streams, quality);
    return stream;
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
    const pagesOpen = (await browser.pages()).length - 1;
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
