import { YouTube, Twitch } from ".";
import { StreamPage } from "./StreamPage";

export function createStreamPage(url: string) {
  if (url.includes("youtube.com")) return new YouTube(url);
  if (url.includes("twitch.tv")) return new Twitch(url);

  return new StreamPage(url);
}
