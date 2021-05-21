const StreamPage = require('lib/stream-page/StreamPage');

class YouTube extends StreamPage {
  async _startStream() {
    const closeDialogBox = () => this.page
      .waitForSelector("#close_modal")
      .then((elem) => this.page.waitForTimeout(500).then(() => elem.click()))
      .catch(() => { });

    const startVideo = () => this.page
      .waitForSelector(".player [data-quality]")
      .then((elem) => this.page.waitForTimeout(500).then(() => elem.click()))
      .catch(() => { });

    await Promise.all([
      closeDialogBox(),
      startVideo(),
    ]);
  }

  getQualityMenu() {
    return this.page
      .waitForSelector(".icon-gears ~ .menu .menu-content");
  }
}

module.exports = YouTube;
