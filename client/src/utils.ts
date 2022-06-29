export function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000) || 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let out = "";

  if (h > 0) out += `${String(h).padStart(2, "0")}:`;
  out += `${String(m).padStart(2, "0")}:`;
  out += `${String(s).padStart(2, "0")}`;

  return out;
}

export function getRecordingName(url: string) {
  if (url.includes("youtube.com")) {
    const streamId = url.match(/(?:\/watch\?v=)([\w-]+)/)?.[1] || "";
    return `${streamId}@youtube`;
  }
  if (url.includes("twitch.tv")) {
    const userName = url.match(/(?:twitch\.tv\/)(\w+)/)?.[1] || "";
    return `${userName}@twitch`;
  }
}
