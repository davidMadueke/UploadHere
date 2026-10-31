import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Warning({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
