const StreamPage = require('lib/stream-page/StreamPage');
const { isMpegUrlData, parseM3u8 } = require('lib/utils');

class Twitch extends StreamPage {
  async getStreams() {
    this.page.waitForFunction(
      async () => {
        const elem = [...document.querySelectorAll("li > span")]
          .find((elem) => elem.textContent == "HLS");
        if (elem) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          elem.click();
          return true;
        }
      },
      { polling: "mutation" }
    )
      .catch(() => { });

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

module.exports = Twitch;
