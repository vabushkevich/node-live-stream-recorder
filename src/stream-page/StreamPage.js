const { EventEmitter } = require('events');
const { isVideoData, resolveAfter } = require('lib/utils');

const NO_DATA_TIMEOUT = 20000;

class StreamPage extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
    this.setUpEvents();
  }

  static create(page) {
    const YouTube = require('lib/stream-page/YouTube');
    const Twitch = require('lib/stream-page/Twitch');

    const url = page.url();

    if (url.includes("youtube.com")) return new YouTube(page);
    if (url.includes("twitch.tv")) return new Twitch(page);

    throw new Error(`Can't get handle for url: ${url}`);
  }

  startStream() {
    this._startStream();
  }

  async setQuality(quality) {
    this.quality = quality;
    const actualQuality = await this._setQuality(quality);
    this.emit("qualityset");
    return actualQuality;
  }

  async close() {
    this.removeAllListeners();
    await this.page.close();
  }

  setUpEvents() {
    this.setUpDataEvent();
    this.setUpStreamLifeEvents();
    this.once("qualityset", () => this.setUpQualityResetEvent());
  }

  setUpDataEvent() {
    this.page.on("response", async (res) => {
      if (!isVideoData(res)) return;
      res.buffer()
        .then(buffer => this.emit("data", buffer))
        .catch(() => { });
    });
  }

  setUpStreamLifeEvents() {
    Promise.race([
      new Promise(resolve => this.once("data", resolve)),
      resolveAfter(NO_DATA_TIMEOUT).then(Promise.reject),
    ])
      .then(() => setTimeout(() => this.setUpStreamLifeEvents()), 5000)
      .catch(() => {
        this.emit("offline");
        this.once("data", () => {
          this.emit("online");
          setTimeout(() => this.setUpStreamLifeEvents());
        });
      });
  }

  setUpQualityResetEvent() {
    this.once("data", () => {
      this._isQualitySet(this.quality)
        .catch(() => true)
        .then(isQualitySet => {
          if (isQualitySet) {
            setTimeout(() => this.setUpQualityResetEvent(), 5000);
          } else {
            this.emit("qualityreset");
            this.once("qualityset", () => setTimeout(() => this.setUpQualityResetEvent()));
          }
        });
    });
  }
}

module.exports = StreamPage;
