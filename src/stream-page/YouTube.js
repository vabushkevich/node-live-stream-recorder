const StreamPage = require('lib/stream-page/StreamPage');
const fetch = require('node-fetch');

const { FETCH_HEADERS } = require('lib/config');

class YouTube extends StreamPage {
  async getM3u8Url() {
    const res = await fetch(this.url, { headers: FETCH_HEADERS });
    const body = await res.text();
    const url = JSON.parse(`"${body.match(/http.+\.m3u8/)[0]}"`);
    return url;
  }
}

module.exports = YouTube;
