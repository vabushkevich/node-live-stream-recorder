import { YouTube } from "./YouTube";
import { StreamPage } from "./StreamPage";

export function createStreamPage(url: string) {
  if (url.includes("youtube.com")) return new YouTube(url);

  return new StreamPage(url);
}
