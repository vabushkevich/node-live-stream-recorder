const StreamPage = require('lib/stream-page/StreamPage');

class Twitch extends StreamPage {
  async getM3u8Url() {
    const page = await this.open();
    const res = await page.waitForResponse((res) =>
      new URL(res.url()).pathname.endsWith(".m3u8")
    );
    this.close();
    return res.url();
  }
}

module.exports = Twitch;
