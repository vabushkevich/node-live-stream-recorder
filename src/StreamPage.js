const { EventEmitter } = require('events');
const { isVideoData, resolveAfter } = require('lib/utils');
const StreamPageUtils = require('lib/stream-page-utils/StreamPageUtils');

const NO_DATA_TIMEOUT = 20000;

class StreamPage extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
    this.pageUtils = StreamPageUtils.create(page);
    this.setUpEvents();
  }

  startStream() {
    this.pageUtils.startStream();
  }

  async setQuality(quality) {
    this.quality = quality;
    const actualQuality = await this.pageUtils.setQuality(quality);
    this.emit("qualityset");
    return actualQuality;
  }

  async close() {
    this.removeAllListeners();
    await this.page.close();
  }

  setUpEvents() {
    this.pageUtils.on("message", msg => this.emit("message", msg));
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
      .then(() => setTimeout(() => this.setUpStreamLifeEvents()))
      .catch(() => {
        this.emit("offline");
        this.once("data", () => {
          this.emit("online");
          setTimeout(() => this.setUpStreamLifeEvents());
        });
      });
  }

  setUpQualityResetEvent() {
    this.once("data", async () => {
      if (await this.pageUtils.isQualitySet(this.quality)) {
        setTimeout(() => this.setUpQualityResetEvent());
      } else {
        this.emit("qualityreset");
        this.once("qualityset", () => setTimeout(() => this.setUpQualityResetEvent()));
      }
    });
  }
}

module.exports = StreamPage;
