const { format: formatDate } = require('date-fns');
const { appendFileSync } = require('fs');

class Logger {
  constructor({ badges = [], logPath } = {}) {
    this.badges = badges;
    this.logPath = logPath;
  }

  log(message) {
    const dateStr = formatDate(new Date(), "d MMM, HH:mm:ss");
    const prefix = [dateStr, ...this.badges].map((v) => `[${v}]`).join(" ");
    let messageStr;

    if (message instanceof Error) {
      messageStr = message.stack;
    } else if (message && typeof message == "object") {
      messageStr = JSON.stringify(message);
    } else {
      messageStr = message;
    }

    const out = `${prefix}: ${messageStr}`;
    console.log(out);
    if (this.logPath) appendFileSync(this.logPath, `${out}\n`);
  }
}

module.exports = Logger;
