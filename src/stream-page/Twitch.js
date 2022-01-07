const StreamPage = require('lib/stream-page/StreamPage');

class Twitch extends StreamPage {
  async getM3u8Url() {
    const page = await this.open();

    page.waitForFunction(
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

    const res = await page.waitForResponse((res) =>
      new URL(res.url()).pathname.endsWith("playlist.m3u8")
    );
    this.close();
    return res.url();
  }
}

module.exports = Twitch;
