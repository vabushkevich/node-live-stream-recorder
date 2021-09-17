const StreamPage = require('lib/stream-page/StreamPage');

class Twitch extends StreamPage {
  async startStream() {
    const closeDialogBox = () => this.page
      .waitForSelector("#close_dialog")
      .then((elem) => this.page.waitForTimeout(500).then(() => elem.click()))
      .catch(() => { });

    closeDialogBox();
  }

  async postStart() {
    const selectHLS = async () => {
      const menu = await this.getQualityMenu();
      const menuItems = await menu.$$(":scope > *");
      const hslMenuItem = await (async () => {
        for (const menuItem of menuItems) {
          const menuItemText = await menuItem.evaluate((elem) => elem.textContent);
          if (menuItemText == "HLS") return menuItem;
        }
      })();
      if (!hslMenuItem) return Promise.reject();
      await this.page.waitForTimeout(500)
        .then(() => hslMenuItem.evaluate((elem) => elem.click()));
    };

    await selectHLS().catch(() => Promise.reject("Can't select HLS"));
  }

  getQualityMenu() {
    return this.page
      .waitForSelector(".icon-gears ~ .menu .menu-content");
  }
}

module.exports = Twitch;
