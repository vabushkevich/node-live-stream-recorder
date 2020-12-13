const { browser } = require('lib/utils');

(async () => {
  async function getQualityMenu() {
    const isQualityMenu = (menu) =>
      [...menu.querySelectorAll("li")].some(li => li.innerText.match(/\d{3,4}pp/));
    const menus = await page.$$("ul.menu-item");
    for (const menu of menus) {
      if (await menu.evaluate(isQualityMenu)) return menu;
    }
  }

  async function getQualityButton(menu, quality) {
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

  const page = await (await browser).newPage();
  page.on("mutation", () => {
    getQualityMenu()
      .then(menu => menu && getQualityButton(menu, 720))
      .then(async button => button && console.log(await button.evaluate(el => el.innerText)));
  });
  page.goto("https://youtube.com/vanandjuani");

  const closeDialog = () => page
    .waitForSelector("#close_modal", { timeout: 5000 })
    .then(async el => {
      await page.waitForTimeout(1000);
      console.log("Closing dialog window");
      await el.click();
    })
    .catch(() => {
      console.log("Can't find '#close_modal' button");
    });
  const startVideo = () => page
    .waitForSelector(".player [data-quality]", { timeout: 5000 })
    .then(async el => {
      await page.waitForTimeout(1000);
      console.log("Starting video manually...");
      await el.click();
    })
    .catch(() => {
      console.log("Unable to start video manually");
    });

  await closeDialog().then(startVideo);

  await page.exposeFunction("onpagemutation", () => {
    page.emit("mutation");
  });

  await page.evaluate(() => {
    new MutationObserver(() => window.onpagemutation())
      .observe(document, { childList: true, subtree: true });
  });
})();
