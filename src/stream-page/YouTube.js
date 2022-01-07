const StreamPage = require('lib/stream-page/StreamPage');

class YouTube extends StreamPage {
  async getM3u8Url() {
    const page = await this.open();
    const res = await page.waitForResponse((res) =>
      res.url().endsWith("playlist.m3u8")
    );
    this.close();
    return res.url();
  }
}

module.exports = YouTube;
