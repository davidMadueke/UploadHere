import { Button } from "@uploadhere/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@uploadhere/ui/components/empty";
import { Link } from "@tanstack/react-router";
import { LinkIcon } from "lucide-react";

export function LinkNotFound({ kind }: { kind: "Host" | "Performer" }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LinkIcon />
          </EmptyMedia>
          <EmptyTitle>This {kind} link doesn't open anything</EmptyTitle>
          <EmptyDescription>
            {kind === "Host"
              ? "Check the link was copied in full. Without the right Host link there is no way back to a Gig."
              : "Check the link was copied in full, or ask the Host for a new one. Removing a Performer stops their link."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link to="/" />} variant="outline">
            Create a Gig
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
