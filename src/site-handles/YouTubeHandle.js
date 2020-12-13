const PageHandle = require('lib/site-handles/PageHandle');

class YouTubeHandle extends PageHandle {
  constructor(url) {
    super(url);
  }

  async init() {
    await super.init();

    const closeDialog = () => this.page
      .waitForSelector("#close_modal", { timeout: 10000 })
      .then(async el => {
        await this.page.waitForTimeout(1000);
        this.emit("message", "Closing dialog window");
        await el.click();
      })
      .catch(() => {
        this.emit("message", "Can't find '#close_modal' button");
      });
    const startVideo = () => this.page
      .waitForSelector(".player [data-quality]", { timeout: 10000 })
      .then(async el => {
        await this.page.waitForTimeout(1000);
        this.emit("message", "Starting video manually...");
        await el.click();
      })
      .catch(() => {
        this.emit("message", "Unable to start video manually");
      });

    closeDialog().then(startVideo);
  }
}

module.exports = YouTubeHandle;
