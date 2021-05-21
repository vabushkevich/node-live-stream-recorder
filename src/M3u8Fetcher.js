const fetch = require('node-fetch');
const { resolveAfter, parseM3u8 } = require('lib/utils');
const { EventEmitter } = require('events');
const http = require('http');
const https = require('https');

const {
  NO_DATA_TIMEOUT,
} = require('lib/config');

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
}

class TaskQueue {
  constructor(maxLength) {
    this.tasks = [];
    this.maxLength = maxLength;
    this.stopped = true;
    this.processing = false;
  }

  add(func) {
    this.tasks.push(func);
    while (this.tasks.length > this.maxLength) this.next();
    this.processTasks();
  }

  async processTasks() {
    if (this.processing == true) return;
    this.processing = true;
    while (this.tasks.length > 0 && this.stopped == false) {
      const func = this.next();
      await func();
    }
    this.processing = false;
  }

  start() {
    this.stopped = false;
    this.processTasks();
  }

  stop() {
    this.stopped = true;
  }

  next() {
    return this.tasks.shift();
  }
}

class M3u8Fetcher extends EventEmitter {
  constructor(m3u8Url) {
    super();
    this.m3u8Url = m3u8Url;
    this.baseUrl = this.m3u8Url.split("/").slice(0, -1).join("/");
    this.stopped = true;
  }

  async getM3u8() {
    const m3u8 = await Promise.race([
      fetch(this.m3u8Url, { agent: getAgent }),
      resolveAfter(3000).then(() =>
        Promise.reject("Timeout while fetching m3u8")
      ),
    ])
      .then((res) => res.text())
      .catch((err) => {
        this.emit("error", err);
        return Promise.reject(err);
      });
    return m3u8;
  }

  async getChunk(chunkName) {
    const chunkUrl = this.baseUrl + "/" + chunkName;
    const chunk = await Promise.race([
      fetch(chunkUrl, { agent: getAgent }),
      resolveAfter(3000).then(() =>
        Promise.reject("Timeout while fetching chunk")
      ),
    ])
      .then((res) => res.buffer())
      .catch((err) => {
        this.emit("error", err);
        return Promise.reject(err);
      });
    return chunk;
  }

  async getNextChunkNames() {
    const m3u8 = await this.getM3u8().catch(() => "");
    const chunkNames = parseM3u8(m3u8).chunkNames;
    return chunkNames;
  }

  async processNextChunks() {
    const chunkNames = await this.getNextChunkNames();
    const chunkNamesToProcess = chunkNames
      .filter((chunkName) => !this.processedChunkNames.has(chunkName));

    for (const chunkName of chunkNamesToProcess) {
      this.tasksQueue.add(async () => {
        await this.getChunk(chunkName)
          .then((chunk) => {
            if (chunk.length == 0) return;
            this.emit("_data", chunk);
            this.emit("data", chunk);
          })
          .catch(() => { })
      });
      this.processedChunkNames.store(chunkName);
    }
  }

  setUpLifeEvents() {
    Promise.race([
      new Promise((resolve) => this.once("_data", () => resolve())),
      resolveAfter(NO_DATA_TIMEOUT).then(Promise.reject),
      this.getStopPromise(),
    ])
      .then((res) => {
        if (res instanceof Error) return;
        setTimeout(() => this.setUpLifeEvents());
      })
      .catch(() => {
        this.emit("offline");
        this.once("_data", () => {
          this.emit("online");
          setTimeout(() => this.setUpLifeEvents());
        });
      });
  }

  async start() {
    this.processedChunkNames = new Cache(10);
    this.tasksQueue = new TaskQueue(10);
    this.tasksQueue.start();
    this.stopped = false;
    this.setUpLifeEvents();
    while (!this.stopped) {
      await Promise.all([
        this.processNextChunks(),
        resolveAfter(1000),
      ]);
    }
  }

  stop() {
    this.removeAllListeners("_data");
    this.stopped = true;
    this.tasksQueue.stop();
    this.emit("stop");
  }

  async getStopPromise() {
    if (!this.stopPromise) {
      this.stopPromise = new Promise((resolve) =>
        this.once("stop", () => resolve(new Error("Fetcher stopped")))
      );
    }
    return this.stopPromise;
  }
}

module.exports = M3u8Fetcher;
