const StreamPage = require('lib/stream-page/StreamPage');
const { isMpegUrlData, parseM3u8 } = require('lib/utils');

class YouTube extends StreamPage {
  async getStreams() {
    const [body, url] = await this.page
      .waitForResponse((res) =>
        isMpegUrlData(res) && res.url().includes("playlist.m3u8")
      )
      .then(async (res) => [await res.text(), res.url()])
      .catch(() => Promise.reject(new Error("Can't get playlist.m3u8")));
    const baseUrl = new URL(".", url).href;
    return parseM3u8(body, baseUrl).streams;
  }
}

module.exports = YouTube;
