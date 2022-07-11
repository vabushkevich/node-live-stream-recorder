import { exec } from "child_process";
import { Response } from "playwright-core";

export function isMpegUrlData(res: Response) {
  const contentType = res.headers()["content-type"];
  if (contentType && contentType.includes("mpegurl")) return true;
  return false;
}

export function saveFrame(
  inPath: string,
  outPath: string,
  {
    position,
    quality,
  }: {
    position?: string;
    quality?: number;
  } = {}
) {
  let seekParam = "";
  const qualityParam = isNaN(quality) ? "" : `-q ${+quality}`;

  if (position) {
    seekParam = (position[0] == "-" ? "-sseof " : "-ss ") + position;
  }

  return new Promise<void>((resolve, reject) => {
    exec(
      `ffmpeg -y -v error ${seekParam} -i "${inPath}" -frames 1 ${qualityParam} "${outPath}"`,
      { timeout: 3000 },
      (err, stdout, stderr) => {
        if (err) return reject(err);
        if (stderr.trim()) return reject(new Error(stderr.trim()));
        resolve();
      }
    );
  });
}

export function resolveIn(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseM3u8(m3u8: string, url: string) {
  const chunkNames = [...m3u8.matchAll(/(?:#EXTINF.*\n)(.+)/ig)]
    .map((match) => match[1]);
  const streams = [...m3u8.matchAll(/(^#EXT-X-STREAM-INF:.+)\n(.+)/gm)]
    .map(([, meta, name]) => {
      const bandwidth = meta.match(/(?<=BANDWIDTH=)\d+/)[0];
      const resolution = meta.match(/(?<=RESOLUTION=)\d+x\d+/)[0];
      const [width, height] = resolution.split("x");
      const frameRate = meta.match(/(?<=FRAME-RATE=)\d+(\.\d+)?/)?.[0];
      const streamUrl = isValidUrl(name) ? name : new URL(name, url).href;

      const stream: {
        name: string;
        bandwidth: number;
        resolution: string;
        width: number;
        height: number;
        url: string;
        frameRate?: number;
      } = {
        name,
        bandwidth: +bandwidth,
        resolution,
        width: +width,
        height: +height,
        url: streamUrl,
      };
      if (frameRate) stream.frameRate = +frameRate;
      return stream;
    });
  return { chunkNames, streams };
}

/**
 * Retry `func` execution until it returns a value or a promise that resolves.
 * The values passed in `delayReducer`: `prevDelay`, `err`.
 *
 * @param {Function} func The function to execute.
 * @param {Function} delayReducer The function that should return the next delay
 * based on the previous delay. If the function returns `null` or `undefined`,
 * there will be no future `func` calls. During the first call `prevDelay`
 * equals `null`.
 * @returns {Promise} The promise that resolves with `func`'s returned value or
 * rejects with a error thrown during last unsuccessful `func` execution.
 */
export async function retry(
  func: Function,
  delayReducer: (prevDelay: number | null, err: Error) => number
) {
  let prevDelay = null;
  while (true) {
    try {
      return await func();
    } catch (err) {
      const delay = delayReducer(prevDelay, err);
      if (delay == null) throw err;
      await resolveIn(delay);
      prevDelay = delay;
    }
  }
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Returns the element in `array` for which `callback` returned the highest
 * rating.
 *
 * @param {Array} array The array to inspect.
 * @param {Function} callback The function called for each element.
 * @returns {*} The element with the highest rating.
 */
export function findClosest<T>(array: T[], callback: (v: T) => number): T {
  let bestRating = 0;
  let closest;
  for (const v of array) {
    const rating = callback(v);
    if (rating > bestRating) {
      bestRating = rating;
      closest = v;
    }
  }
  return closest;
}
