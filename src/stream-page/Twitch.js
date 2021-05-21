const StreamPage = require('lib/stream-page/StreamPage');

class Twitch extends StreamPage {
  async _startStream() {
    const closeDialogBox = () => this.page
      .waitForSelector("#close_dialog")
      .then((elem) => this.page.waitForTimeout(500).then(() => elem.click()))
      .catch(() => { });

    await closeDialogBox();
  }

  getQualityMenu() {
    return this.page
      .waitForSelector(".icon-gears ~ .menu .menu-content");
  }
}

module.exports = Twitch;
