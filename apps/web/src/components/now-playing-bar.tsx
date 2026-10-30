import { Button } from "@uploadhere/ui/components/button";
import { XIcon } from "lucide-react";

export type NowPlaying = {
  trackId: string;
  title: string;
  subtitle?: string;
  url: string;
};

type NowPlayingBarProps = {
  nowPlaying: NowPlaying | null;
  onClose: () => void;
};

export function NowPlayingBar({ nowPlaying, onClose }: NowPlayingBarProps) {
  if (!nowPlaying) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 sm:w-56">
          <p className="truncate font-medium">{nowPlaying.title}</p>
          {nowPlaying.subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{nowPlaying.subtitle}</p>
          ) : null}
        </div>
        <audio
          key={nowPlaying.trackId + nowPlaying.url}
          src={nowPlaying.url}
          controls
          autoPlay
          className="h-10 w-full flex-1"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close player"
          className="absolute top-2 right-2 sm:static"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
