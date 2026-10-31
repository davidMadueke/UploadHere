import { youtubeVideoId } from "@/lib/youtube";

export type YoutubeCheck =
  | { ok: true; videoId: string }
  | { ok: false; reason: "invalid" | "unavailable"; status?: number };

/** Public oEmbed, no API key. 400, 404, and any other failure mean the video cannot be loaded. */
export async function checkYoutubeVideo(url: string): Promise<YoutubeCheck> {
  const videoId = youtubeVideoId(url);
  if (!videoId) return { ok: false, reason: "invalid" };

  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
  endpoint.searchParams.set("format", "json");

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, reason: "unavailable", status: response.status };
    return { ok: true, videoId };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
