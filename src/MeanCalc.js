module.exports = class MeanCalc {
  constructor() {
    this.mean = 0;
    this.i = 0;
  }

  add(value) {
    this.mean = this.mean * this.i / (this.i + 1) + value / (this.i + 1);
    this.i += 1;
  }

  get() {
    return this.mean;
  }
}
