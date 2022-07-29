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
  const urlObj = new URL(url);
  const siteName = urlObj.hostname.split(".").slice(-2)[0];
  let prefix = urlObj.pathname.split("/")[1];

  if (siteName == "youtube") {
    prefix = urlObj.searchParams.get("v");
  }

  return `${prefix || "unnamed"}@${siteName}`;
}
