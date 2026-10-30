import { Button } from "@uploadhere/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@uploadhere/ui/components/card";
import { Input } from "@uploadhere/ui/components/input";
import { Label } from "@uploadhere/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { createGig } from "@/functions/host";
import { NAME_MAX_LENGTH } from "@/lib/validation";

export const Route = createFileRoute("/")({
  component: CreateGigPage,
});

function CreateGigPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  const create = useMutation({
    mutationFn: (gigName: string) => createGig({ data: { name: gigName } }),
    onSuccess: ({ hostToken }) =>
      navigate({ to: "/h/$token", params: { token: hostToken }, search: { created: true } }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create a Gig</CardTitle>
          <CardDescription>
            Name the night. You get a Host link for adding Performers and playing their Tracks.
            There is no account, so that link is the only way back in.
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
    </main>
  );
}
