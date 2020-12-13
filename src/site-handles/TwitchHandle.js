const PageHandle = require('lib/site-handles/PageHandle');

class TwitchHandle extends PageHandle {
  constructor(url) {
    super(url);
  }

  async init() {
    await super.init();

    const closeDialog = () => this.page
      .waitForSelector("#close_dialog", { timeout: 10000 })
      .then(async el => {
        await this.page.waitForTimeout(1000);
        this.emit("message", "Closing dialog window");
        await el.click();
      })
      .catch(() => {
        this.emit("message", "Can't find '#close_dialog' button");
      });

    closeDialog();
  }
}

module.exports = TwitchHandle;
