import { useRef, useState } from "react";
import { toast } from "sonner";

import type { NowPlaying, PlayableTrack } from "@/components/now-playing-player";

type TrackUrlFetcher = (trackId: string, download: boolean) => Promise<{ url: string }>;

/** Play and download both ask the server for a short-lived signed URL at the moment of use. */
export function useTrackAudio(fetchUrl: TrackUrlFetcher) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const request = useRef(0);

  async function play(track: PlayableTrack, artist?: string) {
    const id = ++request.current;
    const name = artist?.trim() || undefined;
    if (track.source === "youtube") {
      if (!track.youtubeVideoId) {
        toast.error("That video can't be loaded.");
        return;
      }
      setLoadingTrackId(null);
      setNowPlaying({
        trackId: track.id,
        title: track.name,
        artist: name,
        youtubeVideoId: track.youtubeVideoId,
      });
      return;
    }

    setLoadingTrackId(track.id);
    try {
      const { url } = await fetchUrl(track.id, false);
      if (request.current !== id) return;
      setNowPlaying({
        trackId: track.id,
        title: track.name,
        artist: name,
        filename: track.filename || undefined,
        url,
      });
    } catch (error) {
      if (request.current !== id) return;
      toast.error(errorMessage(error));
    } finally {
      if (request.current === id) setLoadingTrackId(null);
    }
  }

  async function download(trackId: string) {
    try {
      const { url } = await fetchUrl(trackId, true);
      // The signed URL answers with Content-Disposition: attachment, so the page stays put.
      window.location.assign(url);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function stop() {
    request.current += 1;
    setLoadingTrackId(null);
    setNowPlaying(null);
  }

  return { nowPlaying, loadingTrackId, play, download, stop };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}
