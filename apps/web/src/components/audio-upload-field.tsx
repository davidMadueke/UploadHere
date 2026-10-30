import { Button } from "@uploadhere/ui/components/button";
import { FileUpload } from "@uploadhere/ui/components/file-upload";

import { AUDIO_ACCEPT, MAX_TRACK_BYTES, formatFileSize } from "@/lib/audio-file";

type AudioUploadFieldProps = {
  inputId: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

/** One WAV, MP3, or M4A file. The Filename comes from the file; the Track name is typed apart. */
export function AudioUploadField({ inputId, file, onFileChange, disabled }: AudioUploadFieldProps) {
  return (
    <FileUpload
      inputId={inputId}
      accept={AUDIO_ACCEPT}
      value={file ? [file] : []}
      maxFiles={1}
      maxSize={MAX_TRACK_BYTES}
      acceptedTypesLabel="WAV, MP3, or M4A"
      onChange={(files) => onFileChange(files[0] ?? null)}
      renderOnSuccess={({ files, clear, open }) => {
        const audioFile = files[0];
        if (!audioFile) return null;

        return (
          <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/30 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{audioFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(audioFile.size)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={open}>
                Choose another
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={clear}>
                Clear
              </Button>
            </div>
          </div>
        );
      }}
    />
  );
}
