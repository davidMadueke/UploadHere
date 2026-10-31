import { Button } from "@uploadhere/ui/components/button";
import { XIcon } from "lucide-react";

import { YoutubePlayer } from "./youtube-player";

export type NowPlaying = {
  trackId: string;
  title: string;
  subtitle?: string;
  url?: string;
  youtubeVideoId?: string;
};

type NowPlayingBarProps = {
  nowPlaying: NowPlaying | null;
  onClose: () => void;
};

export function NowPlayingBar({ nowPlaying, onClose }: NowPlayingBarProps) {
  if (!nowPlaying) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-start justify-between gap-3 sm:block sm:w-56">
          <div className="min-w-0">
            <p className="truncate font-medium">{nowPlaying.title}</p>
            {nowPlaying.subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{nowPlaying.subtitle}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close player"
            className="shrink-0 sm:hidden"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </div>
        {nowPlaying.youtubeVideoId ? (
          <div className="min-w-0 flex-1 sm:max-w-md">
            <YoutubePlayer
              videoId={nowPlaying.youtubeVideoId}
              title={nowPlaying.title}
              autoPlay
            />
          </div>
        ) : (
          <audio
            key={nowPlaying.trackId + (nowPlaying.url ?? "")}
            src={nowPlaying.url}
            controls
            autoPlay
            className="h-10 w-full min-w-0 flex-1"
          />
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close player"
          className="hidden sm:inline-flex"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
