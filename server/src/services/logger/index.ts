import { format as formatDate } from "date-fns";
import { appendFileSync } from "fs";

export class Logger {
  badges: any[];
  logPath?: string;

  constructor(
    {
      badges = [],
      logPath,
    }: {
      badges?: any[];
      logPath?: string;
    } = {}
  ) {
    this.badges = badges;
    this.logPath = logPath;
  }

  log(message: any) {
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
