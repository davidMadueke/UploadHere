import { useState } from "react";
import { toast } from "sonner";

import type { NowPlaying } from "@/components/now-playing-bar";

type TrackUrlFetcher = (trackId: string, download: boolean) => Promise<{ url: string }>;

/** Play and download both ask the server for a short-lived signed URL at the moment of use. */
export function useTrackAudio(fetchUrl: TrackUrlFetcher) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  async function play(track: { id: string; name: string }, subtitle?: string) {
    setLoadingTrackId(track.id);
    try {
      const { url } = await fetchUrl(track.id, false);
      setNowPlaying({ trackId: track.id, title: track.name, subtitle, url });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingTrackId(null);
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

  return { nowPlaying, loadingTrackId, play, download, stop: () => setNowPlaying(null) };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}
