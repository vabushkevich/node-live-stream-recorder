const { isVideoData, isMpegUrlData, isSimilarObjects } = require('lib/utils');

const {
  NO_DATA_TIMEOUT,
} = require('lib/config');

class StreamPage {
  constructor(page) {
    this.page = page;
  }

  async startStream() {
    this._startStream();
    await this.page.waitForResponse(isVideoData, { timeout: NO_DATA_TIMEOUT })
      .catch(() => Promise.reject("No video data after starting stream"));
  }

  async setQuality(quality) {
    const menu = await this.getQualityMenu();
    const button = await this.getQualityButton(menu, quality);

    if (!button) {
      return Promise.reject(`No quality button for quality ${JSON.stringify(quality)}`);
    }

    await button.evaluate((elem) => elem.click());
    await this.page.waitForResponse(isVideoData, { timeout: NO_DATA_TIMEOUT })
      .catch(() => Promise.reject("No video data after setting quality"));
  }

  async getQualityButtons(menu) {
    const buttons = [];
    const menuItems = await menu.$$(":scope > *");

    for (const item of menuItems) {
      if (!await this.isQualityButton(item)) continue;
      buttons.push(item);
    }

    return buttons;
  }

  async getQualityButton(menu, quality) {
    const buttons = await this.getQualityButtons(menu);
    for (const button of buttons) {
      const buttonQuality = await this.getButtonQuality(button);
      if (isSimilarObjects(buttonQuality, quality)) return button;
    }
  }

  async getQualityList() {
    const menu = await this.getQualityMenu();
    const buttons = await this.getQualityButtons(menu);
    const qualityList = Promise.all(
      buttons.map((button) => this.getButtonQuality(button))
    );
    return qualityList;
  }

  async isQualityButton(elem) {
    const quality = await this.getButtonQuality(elem);
    return !!quality;
  }

  async getButtonQuality(button) {
    const text = await button.evaluate((elem) => elem.textContent);
    const quality = this.parseQuality(text);
    return quality;
  }

  parseQuality(text) {
    const match = text.match(/(?<resolution>\d{3,4})p(?<framerate>\d{2})?(?=\D|$)/);
    if (!match || !match.groups.resolution) return;
    const { resolution, framerate } = match.groups;
    const quality = { resolution: +resolution };
    if (framerate != null) quality.framerate = +framerate;
    return quality;
  }

  async getM3u8(quality) {
    await this.startStream();

    const targetQualityList = Array.isArray(quality) ? quality : [quality];
    const qualityList = await this.getQualityList();
    const actualQuality = targetQualityList.find((targetQuality) =>
      qualityList.find((sourceQuality) =>
        isSimilarObjects(sourceQuality, targetQuality)
      )
    );

    if (!actualQuality) {
      return Promise.reject(`Target quality ${JSON.stringify(quality)} is not available`);
    }
    await this.setQuality(actualQuality);

    const url = await this.page
      .waitForResponse(isMpegUrlData, { timeout: NO_DATA_TIMEOUT })
      .then((res) => res.url())
      .catch(() => Promise.reject("No m3u8 data"));

    return { url, quality: actualQuality };
  }
}

module.exports = StreamPage;
