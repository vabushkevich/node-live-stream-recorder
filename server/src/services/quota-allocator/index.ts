export class QuotaAllocator {
  free: number;
  queue: Function[];

  constructor(limit: number) {
    this.free = limit;
    this.queue = [];
  }

  async request() {
    if (this.free == 0) {
      await new Promise((resolve) => {
        this.queue.push(resolve);
      });
    }
    this.free -= 1;
    return {
      release: () => {
        if (this.queue.length > 0) {
          const resolveNextReq = this.queue.shift();
          resolveNextReq();
        }
        this.free += 1;
      }
    };
  }
}
