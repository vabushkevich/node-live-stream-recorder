const puppeteer = require('puppeteer-core');

const {
  BROWSER_PATH,
} = require('lib/config');

class StreamPage {
  constructor(url) {
    this.url = url;
  }

  async getStream(quality) {
    const browser = await this.getBrowser();
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
      .finally(() => this.page.close().catch(() => { }));

    const stream = this.findStream(streams, quality);
    return stream;
  }

  async getBrowser() {
    return await StreamPage.browser;
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

StreamPage.browser = puppeteer.launch({
  executablePath: BROWSER_PATH,
});

module.exports = StreamPage;
