export function UploadProgress({ fraction }: { fraction: number }) {
  const percent = Math.round(fraction * 100);

  return (
    <div className="space-y-1">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">Uploading… {percent}%</p>
    </div>
  );
}
