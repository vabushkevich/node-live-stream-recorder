const { EventEmitter } = require('events');
const { getBrowser, resolveAfter } = require('lib/utils');
const { isVideoData } = require('lib/utils');

const NO_DATA_TIMEOUT = 20000;

class PageHandle extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.quality = 0;
    this.state = "online";
  }

  static async create(url) {
    const handleClasses = [
      ["youtube.com", require("lib/site-handles/YouTubeHandle")],
      ["twitch.tv", require("lib/site-handles/TwitchHandle")],
    ];
    const [, handleClass] = handleClasses.find(([hostName]) => url.includes(hostName)) || [];
    if (handleClass) {
      const handle = new handleClass(url);
      await handle.init();
      return handle;
    }
  }

  async init() {
    this.page = await getBrowser().then(browser => browser.newPage());
    await this.page.goto(this.url);
    this.setEvents();
  }

  async close() {
    this.removeAllListeners();
    await this.page.close();
  }

  waitForData() {
    return this.page.waitForResponse(isVideoData, { timeout: NO_DATA_TIMEOUT });
  }

  async setQuality(quality) {
    this.quality = quality;
    return this.getQualityMenu()
      .then(menu => {
        return menu && this.getQualityButton(menu, this.quality);
      })
      .then(async button => {
        if (!button) throw new Error("Can't find quality button");
        await this.page.waitForTimeout(1000);
        await button.evaluate(el => el.click());
        return button.evaluate(el => el.innerText);
      })
      .finally(() => this.emit("qualityset"));
  }

  async qualityIsSet(quality) {
    const menu = await this.getQualityMenu();
    const button = menu && await this.getQualityButton(menu, quality);
    const buttonIsSelected = button && await this.buttonIsSelected(button);
    return buttonIsSelected === true;
  }

  setEvents() {
    this.setDataEvent();
    this.setStreamLifeEvents();
    this.setQualityResetEvent();
    this.setPageMutationEvent();
  }

  setDataEvent() {
    this.page.on("response", async (res) => {
      if (!isVideoData(res)) return;
      res.buffer()
        .then(buffer => this.emit("data", buffer))
        .catch(() => { });
    });
  }

  setStreamLifeEvents() {
    Promise.race([
      resolveAfter(NO_DATA_TIMEOUT).then(() => "offline"),
      new Promise(resolve => this.once("data", () => resolve("online"))),
    ])
      .then(state => {
        if (state == "online") {
          setTimeout(() => this.setStreamLifeEvents());
          return;
        }
        this.emit("offline");
        this.once("data", () => {
          this.emit("online");
          setTimeout(() => this.setStreamLifeEvents());
        });
      });
  }

  setQualityResetEvent() {
    this.once("data", async () => {
      if (this.quality && !await this.qualityIsSet(this.quality)) {
        this.emit("qualityreset");
        this.once("qualityset", () => setTimeout(() => this.setQualityResetEvent()));
      } else {
        setTimeout(() => this.setQualityResetEvent());
      }
    });
  }

  setPageMutationEvent() {
    this.page
      .exposeFunction("onpagemutation", () => this.page.emit("mutation"))
      .then(() =>
        this.page.evaluate(() => {
          new MutationObserver(() => window.onpagemutation())
            .observe(document, { childList: true, subtree: true });
        })
      );
  }

  async getQualityMenu() {
    const isQualityMenu = (menu) =>
      [...menu.querySelectorAll("li")].some(li => li.innerText.match(/\d{3,4}p/));
    const menus = await this.page.$$("ul.menu-item");
    for (const menu of menus) {
      if (await menu.evaluate(isQualityMenu)) return menu;
    }
  }

  async getQualityButton(menu, quality) {
    const button = await menu.evaluateHandle((menu, quality) => {
      const items = [...menu.children]
        .map(el => {
          const itemQuality = +(el.innerText.match(/\d{3,4}(?=p)/) || [0])[0];
          return {
            node: el,
            text: el.innerText.toLowerCase(),
            quality: itemQuality,
            qualityDelta: Math.abs(itemQuality - quality),
          };
        })
        .filter(item => !item.text.includes("auto") && item.quality > 0)
        .sort((item1, item2) => item1.qualityDelta - item2.qualityDelta);
      const item = items[0];
      if (item) {
        return item.node;
      }
    }, quality);
    if (await button.evaluate(el => el != null)) return button;
  }

  buttonIsSelected(button) {
    return button.evaluate(el => el.matches("[class~='selected']"));
  }
}

module.exports = PageHandle;
