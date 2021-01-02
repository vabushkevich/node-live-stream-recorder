const StreamPage = require('lib/stream-page/StreamPage');

class YouTube extends StreamPage {
  constructor(page) {
    super(page);
  }

  async _startStream() {
    const closeDialogBox = () => this.page
      .waitForSelector("#close_modal")
      .then(el => this.page.waitForTimeout(1000).then(() => el.click()));
    const startVideo = () => this.page
      .waitForSelector(".player [data-quality]")
      .then(el => this.page.waitForTimeout(1000).then(() => el.click()));

    await closeDialogBox()
      .then(() => this.emit("message", "Dialog box closed"))
      .catch(() => this.emit("message", "Unable close dialog box"))
      .then(startVideo)
      .then(() => this.emit("message", "Video started manually"))
      .catch(() => this.emit("message", "Unable to start video manually"));
  }

  _setQuality(quality) {
    return this.getQualityButton(quality)
      .then(button => button.evaluate(el => (el.click(), el.innerText)));
  }

  _isQualitySet(quality) {
    return this.getQualityButton(quality)
      .then(button => button.evaluate(isButtonSelected));
  }

  getQualityButton(quality) {
    return this.page
      .waitForFunction(getQualityMenu)
      .then(menu => menu.evaluateHandle(getQualityButton, quality));
  }
}

function getQualityMenu() {
  const menus = [...document.querySelectorAll("ul.menu-item")];
  const isMenu = (menu) =>
    [...menu.querySelectorAll("li")].some(li => li.innerText.match(/\d{3,4}p/));
  return menus.find(isMenu);
}

function getQualityButton(menu, quality) {
  const item = [...menu.children]
    .map(el => {
      const itemQuality = +(el.innerText.match(/\d{3,4}(?=p)/) || [0])[0];
      return {
        el,
        text: el.innerText.toLowerCase(),
        quality: itemQuality,
        qualityDelta: Math.abs(itemQuality - quality),
      };
    })
    .filter(item => !item.text.includes("auto") && item.quality > 0)
    .sort((item1, item2) => item2.qualityDelta - item1.qualityDelta)
    .pop();
  return item && item.el;
}

function isButtonSelected(button) {
  return button.matches("[class~='selected']");
}

module.exports = YouTube;
