import { Input } from "@uploadhere/ui/components/input";
import { Label } from "@uploadhere/ui/components/label";
import { Spinner } from "@uploadhere/ui/components/spinner";
import { useEffect, useRef, useState } from "react";

import { previewYoutubeTrack } from "@/functions/performer";
import { youtubeVideoId } from "@/lib/youtube";

import { Warning } from "./warning";
import { YoutubePlayer } from "./youtube-player";

const PREVIEW_DEBOUNCE_MS = 400;

type PreviewState =
  | { status: "idle" | "pending" | "checking" }
  | { status: "invalid" | "unavailable" }
  | { status: "ready"; videoId: string };

type YoutubeLinkFieldProps = {
  token: string;
  value: string;
  onChange: (value: string) => void;
  onVideoId: (videoId: string | null) => void;
  disabled?: boolean;
};

export function YoutubeLinkField({
  token,
  value,
  onChange,
  onVideoId,
  disabled,
}: YoutubeLinkFieldProps) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const onVideoIdRef = useRef(onVideoId);
  onVideoIdRef.current = onVideoId;

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      onVideoIdRef.current(null);
      setPreview({ status: "idle" });
      return;
    }

    const parsed = youtubeVideoId(trimmed);
    onVideoIdRef.current(null);
    setPreview(parsed ? { status: "checking" } : { status: "pending" });

    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (!parsed) {
        if (!cancelled) setPreview({ status: "invalid" });
        return;
      }

      if (!cancelled) setPreview({ status: "checking" });
      void previewYoutubeTrack({ data: { token, url: trimmed } })
        .then((result) => {
          if (cancelled) return;
          if (result.ok) {
            setPreview({ status: "ready", videoId: result.videoId });
            onVideoIdRef.current(result.videoId);
            return;
          }
          setPreview({ status: result.reason === "invalid" ? "invalid" : "unavailable" });
        })
        .catch(() => {
          if (!cancelled) setPreview({ status: "unavailable" });
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [token, value]);

  const warning =
    preview.status === "invalid"
      ? "That isn't a YouTube link. Paste a watch, share, or Shorts link."
      : preview.status === "unavailable"
        ? "That video can't be loaded."
        : null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="youtube-link">YouTube link</Label>
        <Input
          id="youtube-link"
          value={value}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://www.youtube.com/watch?v="
          disabled={disabled}
          aria-invalid={warning ? true : undefined}
          aria-describedby={warning ? "youtube-link-warning" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {preview.status === "checking" ? (
        <div className="flex aspect-video w-full items-center justify-center gap-2 rounded-2xl border bg-muted/30 text-sm text-muted-foreground">
          <Spinner />
          Checking the link…
        </div>
      ) : null}
      {preview.status === "ready" ? (
        <YoutubePlayer videoId={preview.videoId} title="YouTube preview" />
      ) : null}
      {warning ? (
        <div id="youtube-link-warning">
          <Warning>{warning}</Warning>
        </div>
      ) : null}
    </div>
  );
}
