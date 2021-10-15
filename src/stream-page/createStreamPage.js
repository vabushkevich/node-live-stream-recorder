const { YouTube, Twitch } = require('lib/stream-page');

function createStreamPage(page) {
  const url = page.url();

  if (url.includes("youtube.com")) return new YouTube(page);
  if (url.includes("twitch.tv")) return new Twitch(page);

  throw new Error(`Can't get handle for url: ${url}`);
}

module.exports = createStreamPage;
