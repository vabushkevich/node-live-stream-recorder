const { EventEmitter } = require('events');

class StreamPageController extends EventEmitter {
  constructor(streamPage) {
    super();
    this.streamPage = streamPage;
    this.setUpEvents();
  }

  startStream() {
    this.streamPage.startStream();
  }

  async setQuality(quality) {
    this.quality = quality;
    const actualQuality = await this.streamPage.setQuality(quality);
    this.emit("qualityset");
    return actualQuality;
  }

  async close() {
    this.removeAllListeners();
    await this.streamPage.close();
  }

  setUpEvents() {
    this.once("qualityset", () => this.setUpQualityResetEvent());
  }

  setUpQualityResetEvent() {
    this.streamPage.once("data", () => {
      this.streamPage.isQualitySet(this.quality)
        .catch(() => true)
        .then(isQualitySet => {
          if (isQualitySet) {
            setTimeout(() => this.setUpQualityResetEvent());
          } else {
            this.emit("qualityreset");
            this.once("qualityset", () => setTimeout(() => this.setUpQualityResetEvent()));
          }
        });
    });
  }
}

module.exports = StreamPageController;
