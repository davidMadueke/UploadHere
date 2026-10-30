export const AUDIO_CONTENT_TYPES = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
} as const;

export type AudioExtension = keyof typeof AUDIO_CONTENT_TYPES;

/** Matches the tracks bucket limit, which is the Supabase free plan's per-file ceiling. */
export const MAX_TRACK_BYTES = 50 * 1024 * 1024;

/** react-dropzone accepts a file when either its MIME type or its extension matches. */
export const AUDIO_ACCEPT: Record<string, string[]> = {
  "audio/wav": [".wav"],
  "audio/x-wav": [".wav"],
  "audio/mpeg": [".mp3"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a"],
};

export function audioExtension(filename: string): AudioExtension | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension && extension in AUDIO_CONTENT_TYPES ? (extension as AudioExtension) : null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
