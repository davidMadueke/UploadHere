import { Button } from "@uploadhere/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@uploadhere/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@uploadhere/ui/components/empty";
import { Input } from "@uploadhere/ui/components/input";
import { Label } from "@uploadhere/ui/components/label";
import { Separator } from "@uploadhere/ui/components/separator";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyLinkButton, linkFor } from "@/components/copy-link-button";
import { LinkNotFound } from "@/components/link-not-found";
import { NameDialog } from "@/components/name-dialog";
import { TrackRow } from "@/components/track-row";
import {
  addPerformer,
  getHostTrackUrl,
  removePerformer,
  renameGig,
  renamePerformer,
  setRunningOrder,
} from "@/functions/host";
import { useLinkMutation } from "@/hooks/use-link-mutation";
import { useTrackAudio } from "@/hooks/use-track-audio";
import type { HostGig, HostPerformer } from "@/lib/gig-types";
import { hostGigQuery } from "@/lib/queries";
import { NAME_MAX_LENGTH, isLinkToken, sameName } from "@/lib/validation";

export const Route = createFileRoute("/h/$token/")({
  validateSearch: (search: Record<string, unknown>): { created?: boolean } => ({
    created: search.created === true || search.created === "true" ? true : undefined,
  }),
  loader: async ({ context, params }) => {
    if (!isLinkToken(params.token)) throw notFound();
    const gig = await context.queryClient.ensureQueryData(hostGigQuery(params.token));
    if (!gig) throw notFound();
  },
  component: HostPage,
  notFoundComponent: () => <LinkNotFound kind="Host" />,
});

function HostPage() {
  const { token } = Route.useParams();
  const { created } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: gig } = useSuspenseQuery(hostGigQuery(token));
  const [renaming, setRenaming] = useState(false);

  const rename = useLinkMutation(
    hostGigQuery(token).queryKey,
    (name: string) => renameGig({ data: { token, name } }),
    () => setRenaming(false),
  );

  if (!gig) return <LinkNotFound kind="Host" />;

  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl space-y-6 px-4 py-8">
      {created ? (
        <SaveHostLinkNotice
          token={token}
          onDismiss={() => navigate({ search: {}, replace: true })}
        />
      ) : null}

      <section className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Gig</p>
          <h1 className="font-heading text-2xl font-semibold break-words">{gig.name}</h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setRenaming(true)}>
            <PencilIcon data-icon="inline-start" />
            Rename
          </Button>
          <CopyLinkButton path={`/h/${token}`} label="Copy Host link" className="w-full sm:w-auto" />
          <Button
            size="sm"
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link to="/h/$token/play" params={{ token }} />}
          >
            <PlayIcon data-icon="inline-start" />
            Play the Gig
          </Button>
        </div>
      </section>

      <AddPerformerForm token={token} gig={gig} />
      <RunningOrder token={token} gig={gig} />

      <NameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename the Gig"
        description="Every Performer sees this name."
        label="Gig name"
        initialName={gig.name}
        pending={rename.isPending}
        onSave={(name) => rename.mutate(name)}
      />
    </main>
  );
}

function SaveHostLinkNotice({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const [link, setLink] = useState("");

  useEffect(() => {
    setLink(linkFor(`/h/${token}`));
  }, [token]);

  return (
    <Card className="ring-2 ring-primary/50">
      <CardHeader>
        <CardTitle>Your Host link</CardTitle>
        <CardDescription>
          This link opens the Gig directly. Every Gig is also listed on the home page, so you
          can get back from there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input readOnly value={link} onFocus={(event) => event.currentTarget.select()} />
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton path={`/h/${token}`} label="Copy Host link" variant="default" />
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            I've saved it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddPerformerForm({ token, gig }: { token: string; gig: HostGig }) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const taken = gig.performers.some((performer) => sameName(performer.name, trimmed));

  const add = useLinkMutation(
    hostGigQuery(token).queryKey,
    (performerName: string) => addPerformer({ data: { token, name: performerName } }),
    () => setName(""),
  );

  return (
    <Card size="sm">
      <CardContent>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed && !taken) add.mutate(trimmed);
          }}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="performer-name">Add a Performer</Label>
            <Input
              id="performer-name"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Performer name"
              aria-invalid={taken || undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {taken ? (
              <p className="text-xs text-destructive">
                There is already a Performer with that name on this Gig.
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={!trimmed || taken || add.isPending}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RunningOrder({ token, gig }: { token: string; gig: HostGig }) {
  const queryClient = useQueryClient();
  const queryKey = hostGigQuery(token).queryKey;

  const reorder = useLinkMutation(queryKey, (performerIds: string[]) =>
    setRunningOrder({ data: { token, performerIds } }),
  );

  function move(index: number, offset: -1 | 1) {
    const next = [...gig.performers];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(index + offset, 0, moved);
    queryClient.setQueryData(queryKey, (current) =>
      current ? { ...current, performers: next } : current,
    );
    reorder.mutate(next.map((performer) => performer.id));
  }

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-medium">Running order</h2>
      {gig.performers.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No Performers yet</EmptyTitle>
            <EmptyDescription>
              Add a Performer above, then send them their Performer link so they can upload
              their Tracks.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="space-y-3">
          {gig.performers.map((performer, index) => (
            <PerformerCard
              key={performer.id}
              token={token}
              gig={gig}
              performer={performer}
              position={index + 1}
              canMoveUp={index > 0}
              canMoveDown={index < gig.performers.length - 1}
              moving={reorder.isPending}
              onMove={(offset) => move(index, offset)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

type PerformerCardProps = {
  token: string;
  gig: HostGig;
  performer: HostPerformer;
  position: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  moving: boolean;
  onMove: (offset: -1 | 1) => void;
};

function PerformerCard({
  token,
  gig,
  performer,
  position,
  canMoveUp,
  canMoveDown,
  moving,
  onMove,
}: PerformerCardProps) {
  const queryKey = hostGigQuery(token).queryKey;
  const [renaming, setRenaming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const audio = useTrackAudio((trackId, download) =>
    getHostTrackUrl({ data: { token, trackId, download } }),
  );

  const rename = useLinkMutation(
    queryKey,
    (name: string) => renamePerformer({ data: { token, performerId: performer.id, name } }),
    () => setRenaming(false),
  );
  const remove = useLinkMutation(
    queryKey,
    () => removePerformer({ data: { token, performerId: performer.id } }),
    () => {
      setRemoving(false);
      toast.success(`Removed ${performer.name}`);
    },
  );

  const performerPath = `/p/${performer.linkToken}`;
  const trackCount = performer.tracks.length;

  return (
    <li>
      <Card size="sm">
        <CardHeader>
          
          <CardTitle className="flex w-ful items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs tabular-nums">
              {position}
            </span>
            <span className="min-w-0 font-bold break-words">{performer.name}</span>
            <span className="border-border text-sm text-muted-foreground  ">
            {trackCount === 0 ? "No Tracks yet" : `${trackCount} Track${trackCount === 1 ? "" : "s"}`}
            </span>

          
          </CardTitle>
          <CardAction className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${performer.name} earlier`}
              disabled={!canMoveUp || moving}
              onClick={() => onMove(-1)}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${performer.name} later`}
              disabled={!canMoveDown || moving}
              onClick={() => onMove(1)}
            >
              <ArrowDownIcon />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3">
          <Separator />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <CopyLinkButton
              path={performerPath}
              label="Copy Performer link"
              className="col-span-2 w-full sm:col-span-1 sm:w-auto"
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto"
              nativeButton={false}
              render={<a href={performerPath} target="_blank" rel="noreferrer" />}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Open
            </Button>
            <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setRenaming(true)}>
              <PencilIcon data-icon="inline-start" />
              Rename
            </Button>
            <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setRemoving(true)}>
              <Trash2Icon data-icon="inline-start" />
              Remove
            </Button>
          </div>

          {trackCount > 0 ? (
            <ul className="-mx-3 min-w-0">
              {performer.tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  actions={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        track.source === "youtube"
                          ? "YouTube Tracks can't be downloaded"
                          : `Download ${track.name}`
                      }
                      title={
                        track.source === "youtube"
                          ? "YouTube Tracks can't be downloaded"
                          : `Download ${track.name}`
                      }
                      disabled={track.source === "youtube"}
                      onClick={() => audio.download(track.id)}
                    >
                      <DownloadIcon />
                    </Button>
                  }
                />
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <NameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Rename Performer"
        description={`Performer names must be different from each other on ${gig.name}.`}
        label="Performer name"
        initialName={performer.name}
        pending={rename.isPending}
        onSave={(name) => rename.mutate(name)}
      />
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`Remove ${performer.name}?`}
        description={
          trackCount > 0
            ? `This deletes their ${trackCount} Track${trackCount === 1 ? "" : "s"} and stops their Performer link. It can't be undone.`
            : "This stops their Performer link. It can't be undone."
        }
        confirmLabel="Remove Performer"
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
      />
    </li>
  );
}
