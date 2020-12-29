const { EventEmitter } = require('events');

class StreamPageUtils extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
  }

  static create(page) {
    const YouTube = require('lib/stream-page-utils/YouTube');
    const Twitch = require('lib/stream-page-utils/Twitch');

    const url = page.url();
    
    if (url.includes("youtube.com")) return new YouTube(page);
    if (url.includes("twitch.tv")) return new Twitch(page);

    throw new Error(`Can't get handle for url: ${url}`);
  }
}

module.exports = StreamPageUtils;
