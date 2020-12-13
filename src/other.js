async function onNewElements(selector, handler) {
  let stopped = false;
  const observer = new MutationObserver(mutations => {
    const addedNodes = mutations.flatMap(m => [...m.addedNodes]);
    const els = [];
    for (const node of addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(selector)) els.push(node);
      els.push(...node.querySelectorAll(selector));
      if (els.length > 0 && !stopped) handler(els, off);
    }
  });
  const off = () => {
    stopped = true;
    observer.disconnect();
  };

  const els = [...document.querySelectorAll(selector)];
  if (els.length > 0) handler(els, off);

  if (!stopped) observer.observe(document.body, { childList: true, subtree: true });
}

async function getQualityMenu() {
  return new Promise((resolve, reject) => {
    const isQualityMenu = (el) => !![...el.children].find(
      child => child.matches("li") && child.innerText.match(/\d{3,}p/)
    );
    onNewElements("ul.menu-item", (els, off) => {
      const menu = els.find(el => isQualityMenu(el));
      if (menu) {
        resolve(menu);
        off();
      }
    });
  });
}

async function getQualityItem(menu) {
  const menuItems = [...menu.children];
  const item = menuItems
    .map(el => ({
      el,
      text: el.innerText.toLowerCase(),
      quality: +(el.innerText.match(/\d+(?=p)/) || [0])[0]
    }))
    .filter(item => !item.text.includes("auto") && item.quality > 0 && item.quality < 1080)
    .sort((item1, item2) => item1.quality - item2.quality)
    .pop();
  if (item) return item.el;
}
