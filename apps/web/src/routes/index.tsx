import { Button } from "@uploadhere/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@uploadhere/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@uploadhere/ui/components/empty";
import { Input } from "@uploadhere/ui/components/input";
import { Label } from "@uploadhere/ui/components/label";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { createGig } from "@/functions/host";
import { gigListQuery } from "@/lib/queries";
import { NAME_MAX_LENGTH } from "@/lib/validation";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(gigListQuery()),
  component: HomePage,
});

function HomePage() {
  const { data: gigs } = useSuspenseQuery(gigListQuery());

  return (
    <main className="mx-auto w-full max-w-xl space-y-8 px-4 py-12">
      <CreateGigCard />
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Gigs</h2>
        {gigs.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No Gigs yet</EmptyTitle>
              <EmptyDescription>Create one above. It will stay in this list.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-2">
            {gigs.map((gig) => (
              <li key={gig.id}>
                <Link
                  to="/h/$token"
                  params={{ token: gig.hostToken }}
                  className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{gig.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatGigWhen(gig.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {gig.performerCount === 0
                      ? "No Performers"
                      : `${gig.performerCount} Performer${gig.performerCount === 1 ? "" : "s"}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function CreateGigCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  const create = useMutation({
    mutationFn: (gigName: string) => createGig({ data: { name: gigName } }),
    onSuccess: async ({ hostToken }) => {
      await queryClient.invalidateQueries({ queryKey: gigListQuery().queryKey });
      await navigate({ to: "/h/$token", params: { token: hostToken }, search: { created: true } });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create a Gig</CardTitle>
        <CardDescription>
          Name the Gig. You get a Host link for adding Performers and playing their Tracks.
          Every Gig is listed below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed) create.mutate(trimmed);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="gig-name">Gig name</Label>
            <Input
              id="gig-name"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Friday open mic"
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!trimmed || create.isPending}>
            {create.isPending ? "Creating…" : "Create Gig"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function formatGigWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
