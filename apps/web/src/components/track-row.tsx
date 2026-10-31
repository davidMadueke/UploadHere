import { cn } from "@uploadhere/ui/lib/utils";
import type { ReactNode } from "react";

import { formatFileSize } from "@/lib/audio-file";
import type { TrackView } from "@/lib/gig-types";

type TrackRowProps = {
  track: TrackView;
  active?: boolean;
  actions: ReactNode;
};

export function TrackRow({ track, active, actions }: TrackRowProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2",
        active ? "bg-primary/10" : "hover:bg-muted/50",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{track.name}</p>
        <span className="flex w-full min-w-0 text-xs text-muted-foreground">
          {track.source === "youtube" ? (
            <span className="truncate">YouTube</span>
          ) : (
            <>
              <span className="min-w-0 max-w-[80%] shrink truncate">{track.filename}</span>
              <span className="shrink-0 whitespace-nowrap">{` · ${formatFileSize(track.sizeBytes)}`}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </li>
  );
}
