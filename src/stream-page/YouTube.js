const StreamPage = require('lib/stream-page/StreamPage');
const { isMpegUrlData, parseM3u8 } = require('lib/utils');

class YouTube extends StreamPage {
  async getStreams() {
    const res = await this.page
      .waitForResponse((res) =>
        isMpegUrlData(res) && res.url().includes("playlist.m3u8")
      )
      .catch(() => Promise.reject(new Error("Can't get playlist.m3u8")));
    const body = await res.text();
    const url = res.url();
    const baseUrl = new URL(".", url).href;
    return parseM3u8(body, baseUrl).streams;
  }
}

module.exports = YouTube;
