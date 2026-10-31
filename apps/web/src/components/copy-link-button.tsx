import { Button } from "@uploadhere/ui/components/button";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { toast } from "sonner";

type CopyLinkButtonProps = {
  /** Path on this origin, e.g. /p/abc. */
  path: string;
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
};

export function linkFor(path: string): string {
  return `${window.location.origin}${path}`;
}

export function CopyLinkButton({
  path,
  label = "Copy link",
  variant = "outline",
  size = "sm",
  className,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(linkFor(path));
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it by hand.");
    }
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={copy}>
      {copied ? <CheckIcon data-icon="inline-start" /> : <LinkIcon data-icon="inline-start" />}
      {label}
    </Button>
  );
}
