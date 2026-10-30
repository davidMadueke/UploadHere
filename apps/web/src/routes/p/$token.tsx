import { Button } from "@uploadhere/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@uploadhere/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@uploadhere/ui/components/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@uploadhere/ui/components/empty";
import { Input } from "@uploadhere/ui/components/input";
import { Label } from "@uploadhere/ui/components/label";
import { Spinner } from "@uploadhere/ui/components/spinner";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { DownloadIcon, FileAudioIcon, PencilIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AudioUploadField } from "@/components/audio-upload-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LinkNotFound } from "@/components/link-not-found";
import { NameDialog } from "@/components/name-dialog";
import { NowPlayingBar } from "@/components/now-playing-bar";
import { TrackRow } from "@/components/track-row";
import { UploadProgress } from "@/components/upload-progress";
import {
  getPerformerTrackUrl,
  prepareNewTrack,
  prepareReplacement,
  removeTrack,
  renameTrack,
  saveNewTrack,
  saveReplacement,
} from "@/functions/performer";
import { useLinkMutation } from "@/hooks/use-link-mutation";
import { errorMessage, useTrackAudio } from "@/hooks/use-track-audio";
import type { TrackView } from "@/lib/gig-types";
import { performerPageQuery } from "@/lib/queries";
import { putFile } from "@/lib/upload";
import { NAME_MAX_LENGTH, isLinkToken, sameName } from "@/lib/validation";

export const Route = createFileRoute("/p/$token")({
  loader: async ({ context, params }) => {
    if (!isLinkToken(params.token)) throw notFound();
    const page = await context.queryClient.ensureQueryData(performerPageQuery(params.token));
    if (!page) throw notFound();
  },
  component: PerformerPage,
  notFoundComponent: () => <LinkNotFound kind="Performer" />,
});

function PerformerPage() {
  const { token } = Route.useParams();
  const { data: page } = useSuspenseQuery(performerPageQuery(token));
  const audio = useTrackAudio((trackId, download) =>
    getPerformerTrackUrl({ data: { token, trackId, download } }),
  );
  const [renaming, setRenaming] = useState<TrackView | null>(null);
  const [replacing, setReplacing] = useState<TrackView | null>(null);
  const [removing, setRemoving] = useState<TrackView | null>(null);

  const queryKey = performerPageQuery(token).queryKey;
  const rename = useLinkMutation(
    queryKey,
    (input: { trackId: string; name: string }) => renameTrack({ data: { token, ...input } }),
    () => setRenaming(null),
  );
  const remove = useLinkMutation(
    queryKey,
    (trackId: string) => removeTrack({ data: { token, trackId } }),
    (trackId) => {
      if (audio.nowPlaying?.trackId === trackId) audio.stop();
      setRemoving(null);
    },
  );

  if (!page) return <LinkNotFound kind="Performer" />;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 pb-32">
      <section className="space-y-1">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{page.gigName}</p>
        <h1 className="font-heading text-2xl font-semibold break-words">{page.performerName}</h1>
        <p className="text-sm text-muted-foreground">
          Add the Tracks you want played. Anyone with this link can change them, so only share
          it with people in your group.
        </p>
      </section>

      <AddTrackCard token={token} tracks={page.tracks} />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Your Tracks</h2>
        {page.tracks.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No Tracks yet</EmptyTitle>
              <EmptyDescription>Tracks you add show up here and on the Host's screen.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-1">
            {page.tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                active={audio.nowPlaying?.trackId === track.id}
                actions={
                  <>
                    <IconAction
                      label={`Preview ${track.name}`}
                      loading={audio.loadingTrackId === track.id}
                      onClick={() => audio.play(track, track.filename)}
                    >
                      <PlayIcon />
                    </IconAction>
                    <IconAction label={`Download ${track.name}`} onClick={() => audio.download(track.id)}>
                      <DownloadIcon />
                    </IconAction>
                    <IconAction label={`Rename ${track.name}`} onClick={() => setRenaming(track)}>
                      <PencilIcon />
                    </IconAction>
                    <IconAction label={`Replace the file for ${track.name}`} onClick={() => setReplacing(track)}>
                      <FileAudioIcon />
                    </IconAction>
                    <IconAction label={`Remove ${track.name}`} onClick={() => setRemoving(track)}>
                      <Trash2Icon />
                    </IconAction>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <NameDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title="Rename Track"
        description="The file stays the same. Only the name the Host sees changes."
        label="Track name"
        initialName={renaming?.name ?? ""}
        pending={rename.isPending}
        onSave={(name) => renaming && rename.mutate({ trackId: renaming.id, name })}
      />
      <ReplaceFileDialog token={token} track={replacing} onClose={() => setReplacing(null)} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name ?? "Track"}?`}
        description="This deletes the Track and its file. It can't be undone."
        confirmLabel="Remove Track"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />

      <NowPlayingBar nowPlaying={audio.nowPlaying} onClose={audio.stop} />
    </main>
  );
}

function IconAction({
  label,
  loading,
  onClick,
  children,
}: {
  label: string;
  loading?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </Button>
  );
}

function AddTrackCard({ token, tracks }: { token: string; tracks: TrackView[] }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const trimmed = name.trim();
  const taken = tracks.some((track) => sameName(track.name, trimmed));
  const uploading = progress !== null;

  async function upload() {
    if (!file || !trimmed || taken) return;
    setProgress(0);
    try {
      const prepared = await prepareNewTrack({
        data: { token, name: trimmed, filename: file.name, sizeBytes: file.size },
      });
      await putFile(prepared, file, setProgress);
      await saveNewTrack({ data: { token, path: prepared.path, name: trimmed, filename: file.name } });
      toast.success(`Added "${trimmed}"`);
      setName("");
      setFile(null);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProgress(null);
      await queryClient.invalidateQueries({ queryKey: performerPageQuery(token).queryKey });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a Track</CardTitle>
        <CardDescription>
          Give it a name the Host will recognise, then choose the file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void upload();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="track-name">Track name</Label>
            <Input
              id="track-name"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Opening song backing"
              disabled={uploading}
              aria-invalid={taken || undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {taken ? (
              <p className="text-xs text-destructive">You already have a Track with that name.</p>
            ) : null}
          </div>
          <AudioUploadField inputId="track-file" file={file} onFileChange={setFile} disabled={uploading} />
          {uploading ? <UploadProgress fraction={progress} /> : null}
          <Button type="submit" className="w-full" disabled={!file || !trimmed || taken || uploading}>
            {uploading ? "Uploading…" : "Upload Track"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReplaceFileDialog({
  token,
  track,
  onClose,
}: {
  token: string;
  track: TrackView | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const uploading = progress !== null;

  function close() {
    if (uploading) return;
    setFile(null);
    onClose();
  }

  async function replace() {
    if (!track || !file) return;
    setProgress(0);
    try {
      const prepared = await prepareReplacement({
        data: { token, trackId: track.id, filename: file.name, sizeBytes: file.size },
      });
      await putFile(prepared, file, setProgress);
      await saveReplacement({
        data: { token, trackId: track.id, path: prepared.path, filename: file.name },
      });
      toast.success(`Replaced the file for "${track.name}"`);
      setProgress(null);
      setFile(null);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
      setProgress(null);
    } finally {
      await queryClient.invalidateQueries({ queryKey: performerPageQuery(token).queryKey });
    }
  }

  return (
    <Dialog open={track !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace the file</DialogTitle>
          <DialogDescription>
            {track
              ? `"${track.name}" keeps its name. The new file takes the place of ${track.filename}.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 pt-4">
          <AudioUploadField inputId="replace-file" file={file} onFileChange={setFile} disabled={uploading} />
          {uploading ? <UploadProgress fraction={progress} /> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" disabled={uploading} onClick={close}>
            Cancel
          </Button>
          <Button disabled={!file || uploading} onClick={() => void replace()}>
            {uploading ? "Uploading…" : "Replace file"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
