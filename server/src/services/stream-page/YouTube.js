const StreamPage = require('./StreamPage');
const fetch = require('node-fetch');

const { FETCH_HEADERS } = require('server/constants');

class YouTube extends StreamPage {
  async getM3u8Url() {
    const res = await fetch(this.url, { headers: FETCH_HEADERS });
    const body = await res.text();
    const match = body.match(/https?:\/\/[\w\.\/%-]+.m3u8/);
    if (!match) throw new Error("Unable to find m3u8 url in the response");
    const url = match[0];
    return url;
  }
}

module.exports = YouTube;
