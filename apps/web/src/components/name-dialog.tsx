import { Button } from "@uploadhere/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@uploadhere/ui/components/dialog";
import { Input } from "@uploadhere/ui/components/input";
import { Label } from "@uploadhere/ui/components/label";
import { useEffect, useId, useState } from "react";

import { NAME_MAX_LENGTH } from "@/lib/validation";

type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  initialName: string;
  pending: boolean;
  onSave: (name: string) => void;
};

/** Rename a Gig, Performer, or Track. Every name is required and trimmed. */
export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  initialName,
  pending,
  onSave,
}: NameDialogProps) {
  const inputId = useId();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const trimmed = name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed && trimmed !== initialName) onSave(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="space-y-2 px-6 pt-4">
            <Label htmlFor={inputId}>{label}</Label>
            <Input
              id={inputId}
              value={name}
              maxLength={NAME_MAX_LENGTH}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !trimmed || trimmed === initialName}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
