import { Button } from "@uploadhere/ui/components/button";
import { DialogDescription, DialogTitle } from "@uploadhere/ui/components/dialog";
import { Slider } from "@uploadhere/ui/components/slider";
import { cn } from "@uploadhere/ui/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { YoutubePlayer } from "./youtube-player";

export type PlayableTrack = {
  id: string;
  name: string;
  source: "file" | "youtube";
  youtubeVideoId: string | null;
  filename: string | null;
};

export type NowPlaying = {
  trackId: string;
  title: string;
  artist?: string;
  filename?: string;
  url?: string;
  youtubeVideoId?: string;
};

type NowPlayingPlayerProps = {
  nowPlaying: NowPlaying | null;
  tracks: PlayableTrack[];
  onPlay: (track: PlayableTrack) => void;
  onClose: () => void;
  switching?: boolean;
};

/** Space the page content needs so the docked player does not cover the last row. */
export function nowPlayingOffset(nowPlaying: NowPlaying | null): string | false {
  if (!nowPlaying) return false;
  return nowPlaying.youtubeVideoId ? "pb-96" : "pb-80";
}

export function NowPlayingPlayer({
  nowPlaying,
  tracks,
  onPlay,
  onClose,
  switching = false,
}: NowPlayingPlayerProps) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const shownRef = useRef(nowPlaying);
  if (nowPlaying) shownRef.current = nowPlaying;
  const shown = nowPlaying ?? shownRef.current;

  const index = shown ? tracks.findIndex((track) => track.id === shown.trackId) : -1;
  const previous = index > 0 ? tracks[index - 1] : undefined;
  const next = index >= 0 && index < tracks.length - 1 ? tracks[index + 1] : undefined;

  return (
    <DialogPrimitive.Root
      open={nowPlaying !== null}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          initialFocus={false}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex max-h-[calc(100dvh-1rem)] flex-col gap-4 overflow-y-auto rounded-t-3xl border-t bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 outline-none transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
            "sm:w-[32rem]",
            "sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:max-h-[calc(100dvh-3rem)] sm:-translate-x-1/2 sm:rounded-3xl sm:border sm:p-5",
          )}
        >
          {shown ? (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Now Playing</p>
                <DialogTitle className="flex min-w-0 items-baseline gap-2">
                  <span className="max-w-[60%] shrink-0 truncate text-2xl font-bold text-foreground">
                    {shown.title}
                  </span>
                  {shown.artist ? (
                    <span className="min-w-0 truncate text-2xl font-bold text-primary">{shown.artist}</span>
                  ) : null}
                </DialogTitle>
                {shown.filename ? (
                  <DialogDescription className="truncate text-xs">{shown.filename}</DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">
                    {shown.youtubeVideoId ? "YouTube video" : "Audio file"}
                  </DialogDescription>
                )}
              </div>
              <DialogPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Close player"
                  />
                }
              >
                <XIcon />
              </DialogPrimitive.Close>
            </div>
          ) : null}
          {nowPlaying?.youtubeVideoId ? (
            <YoutubePlayer videoId={nowPlaying.youtubeVideoId} title={nowPlaying.title} autoPlay />
          ) : null}
          {shown && !shown.youtubeVideoId ? (
            <AudioDeck
              key={shown.trackId + (shown.url ?? "")}
              src={nowPlaying?.url ?? null}
              volume={volume}
              muted={muted}
              onVolumeChange={setVolume}
              onMutedChange={setMuted}
              previousDisabled={!previous || switching}
              nextDisabled={!next || switching}
              onPrevious={() => previous && onPlay(previous)}
              onNext={() => next && onPlay(next)}
            />
          ) : null} 
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function AudioDeck({
  src,
  volume,
  muted,
  onVolumeChange,
  onMutedChange,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: {
  src: string | null;
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const scrubbing = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const silent = muted || volume === 0;

  volumeRef.current = volume;
  mutedRef.current = muted;

  const attachAudio = useCallback((node: HTMLAudioElement | null) => {
    audioRef.current = node;
    if (!node) return;
    node.volume = volumeRef.current;
    node.muted = mutedRef.current;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted, src]);

  function rememberDuration(seconds: number) {
    if (Number.isFinite(seconds)) setDuration(seconds);
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  function seek(value: number | readonly number[]) {
    const next = sliderValue(value);
    scrubbing.current = true;
    setCurrentTime(next);
    if (audioRef.current) audioRef.current.currentTime = next;
  }

  function toggleMute() {
    if (silent) {
      onMutedChange(false);
      if (volume === 0) onVolumeChange(1);
      return;
    }
    onMutedChange(true);
  }

  const ready = Number.isFinite(duration) && duration > 0;
  const positionMax = ready ? duration : 1;

  return (
    <>
      {src ? (
        <audio
          ref={attachAudio}
          src={src}
          autoPlay
          preload="metadata"
          className="sr-only"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => {
            if (scrubbing.current) return;
            setCurrentTime(event.currentTarget.currentTime);
          }}
          onLoadedMetadata={(event) => rememberDuration(event.currentTarget.duration)}
          onDurationChange={(event) => rememberDuration(event.currentTarget.duration)}
        />
      ) : null}
      <div className="flex-col items-center">
        <div className="min-w-0 flex-1 space-y-1.5 gap-2 pt-4">
          <Slider
            label="Position in the track"
            min={0}
            max={positionMax}
            step={0.1}
            largeStep={5}
            disabled={!ready || !src}
            value={[Math.min(currentTime, positionMax)]}
            onValueChange={seek}
            onValueCommitted={() => {
              scrubbing.current = false;
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatClock(currentTime)}</span>
            <span>{formatClock(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pb-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous track"
          disabled={previousDisabled || !src}
          onClick={onPrevious}
        >
          <SkipBackIcon />
        </Button>
        <Button
          size="icon-lg"
          aria-label={playing ? "Pause" : "Play"}
          disabled={!src}
          onClick={togglePlayback}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next track"
          disabled={nextDisabled || !src}
          onClick={onNext}
        >
          <SkipForwardIcon />
        </Button>
      </div>

        <div className="flex w-full  items-center px-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={silent ? "Unmute" : "Mute"}
            aria-pressed={silent}
            disabled={!src}
            onClick={toggleMute}
          >
            <VolumeIcon silent={silent} volume={volume} />
          </Button>
          <Slider
            label="Volume"
            className="flex-1 pr-2"
            indicatorColour="bg-primary/40"
            min={0}
            max={100}
            step={1}
            disabled={!src}
            value={[Math.round(volume * 100)]}
            onValueChange={(value) => {
              const next = sliderValue(value) / 100;
              onVolumeChange(next);
              onMutedChange(next === 0);
            }}
          />
        </div>
      </div>
      
    </>
  );
}

function VolumeIcon({ silent, volume }: { silent: boolean; volume: number }) {
  if (silent) return <VolumeXIcon />;
  if (volume < 0.5) return <Volume1Icon />;
  return <Volume2Icon />;
}

function sliderValue(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0);
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const rest = total % 60;
  const minutes = Math.floor(total / 60);
  if (total < 3600) return `${minutes}:${rest.toString().padStart(2, "0")}`;
  const hours = Math.floor(total / 3600);
  const hourMinutes = Math.floor((total % 3600) / 60);
  return `${hours}:${hourMinutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}
