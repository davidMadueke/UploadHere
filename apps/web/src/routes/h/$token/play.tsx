import { Button } from "@uploadhere/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@uploadhere/ui/components/empty";
import { Spinner } from "@uploadhere/ui/components/spinner";
import { cn } from "@uploadhere/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  PlayIcon,
  SettingsIcon,
} from "lucide-react";

import { LinkNotFound } from "@/components/link-not-found";
import { NowPlayingBar } from "@/components/now-playing-bar";
import { TrackRow } from "@/components/track-row";
import { getHostTrackUrl } from "@/functions/host";
import { useTrackAudio } from "@/hooks/use-track-audio";
import { hostGigQuery } from "@/lib/queries";
import { isLinkToken } from "@/lib/validation";

export const Route = createFileRoute("/h/$token/play")({
  validateSearch: (search: Record<string, unknown>): { performer?: string } => ({
    performer: typeof search.performer === "string" ? search.performer : undefined,
  }),
  loader: async ({ context, params }) => {
    if (!isLinkToken(params.token)) throw notFound();
    const gig = await context.queryClient.ensureQueryData(hostGigQuery(params.token));
    if (!gig) throw notFound();
  },
  component: PlayPage,
  notFoundComponent: () => <LinkNotFound kind="Host" />,
});

function PlayPage() {
  const { token } = Route.useParams();
  const { performer: performerId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: gig } = useSuspenseQuery(hostGigQuery(token));
  const audio = useTrackAudio((trackId, download) =>
    getHostTrackUrl({ data: { token, trackId, download } }),
  );

  if (!gig) return <LinkNotFound kind="Host" />;

  const performers = gig.performers;
  const currentIndex = Math.max(
    0,
    performers.findIndex((performer) => performer.id === performerId),
  );
  const current = performers[currentIndex];

  function moveTo(index: number) {
    const target = performers[index];
    if (target) navigate({ search: { performer: target.id }, replace: true });
  }

  return (
    <main
      className={cn(
        "mx-auto w-full min-w-0 max-w-5xl px-4 py-6",
        audio.nowPlaying?.youtubeVideoId ? "pb-96" : "pb-32",
      )}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Playing</p>
          <h1 className="font-heading text-2xl font-semibold break-words">{gig.name}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link to="/h/$token" params={{ token }} />}
        >
          <SettingsIcon data-icon="inline-start" />
          Set up
        </Button>
      </div>

      {!current ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No Performers yet</EmptyTitle>
            <EmptyDescription>Add Performers from the set-up page first.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid min-w-0 gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label="Running order" className="min-w-0">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Running order</h2>
            <ol className="space-y-1">
              {performers.map((performer, index) => (
                <li key={performer.id}>
                  <button
                    type="button"
                    onClick={() => moveTo(index)}
                    aria-current={index === currentIndex ? "step" : undefined}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-colors",
                      index === currentIndex
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="w-5 shrink-0 text-right tabular-nums opacity-70">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{performer.name}</span>
                    <span className="shrink-0 text-xs tabular-nums opacity-70">
                      {performer.tracks.length}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <section className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {currentIndex + 1} of {performers.length}
                </p>
                <h2 className="font-heading text-xl font-medium break-words">{current.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={currentIndex === 0}
                  onClick={() => moveTo(currentIndex - 1)}
                >
                  <ChevronLeftIcon data-icon="inline-start" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={currentIndex === performers.length - 1}
                  onClick={() => moveTo(currentIndex + 1)}
                >
                  Next
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </div>

            {current.tracks.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>{current.name} has no Tracks</EmptyTitle>
                  <EmptyDescription>
                    New Tracks show up here within a few seconds of being added.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="space-y-1">
                {current.tracks.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    active={audio.nowPlaying?.trackId === track.id}
                    actions={
                      <>
                        <Button
                          size="sm"
                          disabled={audio.loadingTrackId === track.id}
                          onClick={() => audio.play(track, current.name)}
                        >
                          {audio.loadingTrackId === track.id ? (
                            <Spinner data-icon="inline-start" />
                          ) : (
                            <PlayIcon data-icon="inline-start" />
                          )}
                          Play
                        </Button>
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
                      </>
                    }
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <NowPlayingBar nowPlaying={audio.nowPlaying} onClose={audio.stop} />
    </main>
  );
}
