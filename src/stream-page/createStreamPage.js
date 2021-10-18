const { YouTube, Twitch } = require('lib/stream-page');

function createStreamPage(url) {
  if (url.includes("youtube.com")) return new YouTube(url);
  if (url.includes("twitch.tv")) return new Twitch(url);

  throw new Error(`Can't get handle for url: ${url}`);
}

module.exports = createStreamPage;
