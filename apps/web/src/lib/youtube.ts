const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Watch, share (youtu.be), Shorts, and embed URLs. Anything else is not a video id. */
export function youtubeVideoId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return videoId(parts[0]);
  }

  const watchHost =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com";
  if (!watchHost) return null;

  if (url.pathname === "/watch") {
    return videoId(url.searchParams.get("v"));
  }

  const [kind, id] = parts;
  if (kind === "shorts" || kind === "embed" || kind === "live" || kind === "v") {
    return videoId(id);
  }

  return null;
}

function videoId(value: string | null | undefined): string | null {
  return value && VIDEO_ID.test(value) ? value : null;
}

export function youtubeEmbedUrl(videoId: string, autoPlay: boolean): string {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("rel", "0");
  if (autoPlay) url.searchParams.set("autoplay", "1");
  return url.toString();
}
