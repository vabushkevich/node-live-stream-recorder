const fetch = require('node-fetch');
const { resolveIn, parseM3u8 } = require('lib/utils');
const { EventEmitter } = require('events');
const http = require('http');
const https = require('https');
const { extname } = require('path');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

function getAgent(url) {
  return (url.protocol == 'http:') ? httpAgent : httpsAgent;
}

class Cache {
  constructor(maxLength) {
    this.items = [];
    this.maxLength = maxLength;
  }

  store(item) {
    this.items.push(item);
    while (this.items.length > this.maxLength) this.items.shift();
  }

  has(item) {
    return this.items.includes(item);
  }

  length() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}

class M3u8Fetcher extends EventEmitter {
  constructor(
    m3u8Url,
    {
      timeout = 3000,
      frequency = 1000
    } = {},
  ) {
    super();
    const url = new URL(m3u8Url);
    this.m3u8Url = `${url.origin}${url.pathname}`;
    this.timeout = timeout;
    this.frequency = frequency;
    this.processedChunkNames = new Cache(20);
    this.baseUrl = this.m3u8Url.split("/").slice(0, -1).join("/");
    this.stopped = true;
  }

  async getM3u8() {
    const m3u8 = await Promise.race([
      fetch(this.m3u8Url, { agent: getAgent }),
      resolveIn(this.timeout).then(() =>
        Promise.reject(new Error("Timeout while requesting m3u8"))
      ),
    ])
      .then((res) => res.text());
    return m3u8;
  }

  async getChunk(chunkName) {
    const chunkUrl = this.baseUrl + "/" + chunkName;
    const chunk = await Promise.race([
      fetch(chunkUrl, { agent: getAgent }),
      resolveIn(this.timeout).then(() =>
        Promise.reject(new Error("Timeout while requesting chunk"))
      ),
    ])
      .then((res) => res.buffer());
    return chunk;
  }

  async requestNextChunks() {
    this.emit("message", "Requesting m3u8");
    const m3u8 = await this.getM3u8();
    const chunkNames = parseM3u8(m3u8).chunkNames;
    const chunks = chunkNames
      .filter((name) => !this.processedChunkNames.has(name))
      .map((name) => ({ name, ext: extname(name).split("?")[0] }));
    this.emit("message", `Got m3u8. Chunks count: ${chunkNames.length}, to fetch: ${chunks.length}`);

    await Promise.all(
      chunks.map(async (chunk) => {
        this.emit("message", `Requesting chunk "${chunk.name}"`);
        chunk.buffer = await this.getChunk(chunk.name);
        this.emit("message", `Got chunk: "${chunk.name}", length: ${chunk.buffer.length}`);
      })
    );

    for (const chunk of chunks) {
      this.processedChunkNames.store(chunk.name);
      if (chunk.buffer && chunk.buffer.length === 0) continue;
      this.emit("data", chunk);
    }
  }

  async start() {
    this.processedChunkNames.clear();
    this.stopped = false;
    while (!this.stopped) {
      await Promise.all([
        this.requestNextChunks().catch((err) => this.emit("error", err)),
        resolveIn(this.frequency),
      ]);
    }
  }

  stop() {
    this.stopped = true;
  }
}

module.exports = M3u8Fetcher;
