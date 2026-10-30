import { randomUUID } from "node:crypto";

import { db, TRACKS_BUCKET } from "@uploadhere/db";
import { env } from "@uploadhere/env/server";

import {
  AUDIO_CONTENT_TYPES,
  MAX_TRACK_BYTES,
  audioExtension,
  formatFileSize,
} from "@/lib/audio-file";
import type { HostGig, PerformerPage, PreparedUpload, TrackView } from "@/lib/gig-types";
import { sameName } from "@/lib/validation";

import { hashLinkToken, newLinkToken } from "./link-token";

const UNIQUE_VIOLATION = "23505";
const RUNNING_ORDER_MISMATCH = "22023";
const SIGNED_URL_SECONDS = 60 * 60;

const HOST_LINK_UNKNOWN = "This Host link doesn't open a Gig.";
const PERFORMER_LINK_UNKNOWN =
  "This Performer link doesn't work. It may be mistyped, or the Host removed this Performer.";
const PERFORMER_GONE = "That Performer is no longer on this Gig.";
const TRACK_GONE = "That Track is no longer there.";

type DbError = { message: string; code?: unknown };

/** Unique violations become the message for the constraint named in the error. Anything else
 *  is logged and replaced, so database details never reach a browser. */
function failed(error: DbError, uniqueMessages: Record<string, string> = {}): never {
  if (error.code === UNIQUE_VIOLATION) {
    for (const [constraint, message] of Object.entries(uniqueMessages)) {
      if (error.message.includes(constraint)) {
        throw new Error(message);
      }
    }
  }
  console.error("[uploadhere] Supabase error", error);
  throw new Error("Something went wrong on our side. Try again.");
}

const performerNameTaken = (name: string) => `There is already a Performer called "${name}" on this Gig.`;
const trackNameTaken = (name: string) => `You already have a Track called "${name}".`;

function toTrackViews(
  rows: { id: string; name: string; filename: string; size_bytes: number; updated_at: string }[],
): TrackView[] {
  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      filename: row.filename,
      sizeBytes: row.size_bytes,
      updatedAt: row.updated_at,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

async function removeObjects(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await db().storage.from(TRACKS_BUCKET).remove(paths);
  if (error) {
    // The rows are already gone, so the Track is gone for every link. Log the leftover files.
    console.error("[uploadhere] Could not remove Track files", paths, error);
  }
}

async function signedTrackUrl(path: string, downloadAs: string | null) {
  const { data, error } = await db()
    .storage.from(TRACKS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS, downloadAs ? { download: downloadAs } : undefined);
  if (error) failed(error);
  return { url: data.signedUrl };
}

// Host link

async function findGig(hostToken: string) {
  const { data, error } = await db()
    .from("gigs")
    .select("id, name")
    .eq("host_token_hash", hashLinkToken(hostToken))
    .maybeSingle();
  if (error) failed(error);
  return data;
}

async function requireGig(hostToken: string) {
  const gig = await findGig(hostToken);
  if (!gig) throw new Error(HOST_LINK_UNKNOWN);
  return gig;
}

export async function createGig(name: string) {
  const hostToken = newLinkToken();
  const { error } = await db()
    .from("gigs")
    .insert({ name, host_token_hash: hashLinkToken(hostToken) });
  if (error) failed(error);
  return { hostToken };
}

export async function getHostGig(hostToken: string): Promise<HostGig | null> {
  const { data, error } = await db()
    .from("gigs")
    .select(
      "id, name, performers(id, name, position, link_token, tracks(id, name, filename, size_bytes, updated_at))",
    )
    .eq("host_token_hash", hashLinkToken(hostToken))
    .maybeSingle();
  if (error) failed(error);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    performers: [...data.performers]
      .sort((a, b) => a.position - b.position)
      .map((performer) => ({
        id: performer.id,
        name: performer.name,
        linkToken: performer.link_token,
        tracks: toTrackViews(performer.tracks),
      })),
  };
}

export async function renameGig(hostToken: string, name: string) {
  const gig = await requireGig(hostToken);
  const { error } = await db().from("gigs").update({ name }).eq("id", gig.id);
  if (error) failed(error);
}

export async function addPerformer(hostToken: string, name: string) {
  const gig = await requireGig(hostToken);
  const { data: last, error: lastError } = await db()
    .from("performers")
    .select("position")
    .eq("gig_id", gig.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) failed(lastError);

  const { error } = await db()
    .from("performers")
    .insert({
      gig_id: gig.id,
      name,
      position: (last?.position ?? -1) + 1,
      link_token: newLinkToken(),
    });
  if (error) {
    failed(error, {
      performers_name_unique: performerNameTaken(name),
      performers_position_unique: "Someone else changed the Running order. Try again.",
    });
  }
}

export async function renamePerformer(hostToken: string, performerId: string, name: string) {
  const gig = await requireGig(hostToken);
  const { data, error } = await db()
    .from("performers")
    .update({ name })
    .eq("id", performerId)
    .eq("gig_id", gig.id)
    .select("id");
  if (error) failed(error, { performers_name_unique: performerNameTaken(name) });
  if (data.length === 0) throw new Error(PERFORMER_GONE);
}

/** Deleting the row stops the Performer link and removes their Tracks. Files go after. */
export async function removePerformer(hostToken: string, performerId: string) {
  const gig = await requireGig(hostToken);
  const { data: tracks, error: tracksError } = await db()
    .from("tracks")
    .select("storage_path, performers!inner(gig_id)")
    .eq("performer_id", performerId)
    .eq("performers.gig_id", gig.id);
  if (tracksError) failed(tracksError);

  const { data, error } = await db()
    .from("performers")
    .delete()
    .eq("id", performerId)
    .eq("gig_id", gig.id)
    .select("id");
  if (error) failed(error);
  if (data.length === 0) throw new Error(PERFORMER_GONE);

  await removeObjects(tracks.map((track) => track.storage_path));
}

export async function setRunningOrder(hostToken: string, performerIds: string[]) {
  const gig = await requireGig(hostToken);
  const { error } = await db().rpc("set_running_order", {
    p_gig_id: gig.id,
    p_performer_ids: performerIds,
  });
  if (error) {
    if (error.code === RUNNING_ORDER_MISMATCH) {
      throw new Error("The Performers changed while you were moving them. Refresh and try again.");
    }
    failed(error);
  }
}

export async function hostTrackUrl(hostToken: string, trackId: string, download: boolean) {
  const gig = await requireGig(hostToken);
  const { data, error } = await db()
    .from("tracks")
    .select("storage_path, filename, performers!inner(gig_id)")
    .eq("id", trackId)
    .eq("performers.gig_id", gig.id)
    .maybeSingle();
  if (error) failed(error);
  if (!data) throw new Error(TRACK_GONE);
  return signedTrackUrl(data.storage_path, download ? data.filename : null);
}

// Performer link

async function requirePerformer(linkToken: string) {
  const { data, error } = await db()
    .from("performers")
    .select("id, name, gig_id, gigs(name)")
    .eq("link_token", linkToken)
    .maybeSingle();
  if (error) failed(error);
  if (!data) throw new Error(PERFORMER_LINK_UNKNOWN);
  return data;
}

type Performer = Awaited<ReturnType<typeof requirePerformer>>;

export async function getPerformerPage(linkToken: string): Promise<PerformerPage | null> {
  const { data, error } = await db()
    .from("performers")
    .select("name, gigs(name), tracks(id, name, filename, size_bytes, updated_at)")
    .eq("link_token", linkToken)
    .maybeSingle();
  if (error) failed(error);
  if (!data) return null;

  return {
    gigName: data.gigs.name,
    performerName: data.name,
    tracks: toTrackViews(data.tracks),
  };
}

async function ensureTrackNameFree(performerId: string, name: string, exceptTrackId?: string) {
  const { data, error } = await db()
    .from("tracks")
    .select("id, name")
    .eq("performer_id", performerId);
  if (error) failed(error);
  if (data.some((track) => track.id !== exceptTrackId && sameName(track.name, name))) {
    throw new Error(trackNameTaken(name));
  }
}

async function requireTrack(performer: Performer, trackId: string) {
  const { data, error } = await db()
    .from("tracks")
    .select("id, storage_path, filename")
    .eq("id", trackId)
    .eq("performer_id", performer.id)
    .maybeSingle();
  if (error) failed(error);
  if (!data) throw new Error(TRACK_GONE);
  return data;
}

async function signedUploadFor(
  performer: Performer,
  filename: string,
  sizeBytes: number,
): Promise<PreparedUpload> {
  const extension = audioExtension(filename);
  if (!extension) throw new Error("Tracks must be WAV, MP3, or M4A files.");
  if (sizeBytes > MAX_TRACK_BYTES) {
    throw new Error(`That file is ${formatFileSize(sizeBytes)}. The limit is 50 MB.`);
  }

  const path = `${performer.gig_id}/${performer.id}/${randomUUID()}.${extension}`;
  const { data, error } = await db().storage.from(TRACKS_BUCKET).createSignedUploadUrl(path);
  if (error) failed(error);

  return {
    path,
    signedUrl: data.signedUrl,
    contentType: AUDIO_CONTENT_TYPES[extension],
    apiKey: env.SUPABASE_PUBLISHABLE_KEY,
  };
}

/** The browser chose neither the path nor the size. Both come from the server: the path from
 *  signedUploadFor, the size from Storage after the upload landed. */
async function uploadedFile(performer: Performer, path: string, filename: string) {
  const extension = audioExtension(filename);
  const expected = new RegExp(
    `^${performer.gig_id}/${performer.id}/[0-9a-f-]{36}\\.${extension ?? "-"}$`,
  );
  if (!extension || !expected.test(path)) {
    throw new Error("That upload doesn't belong to this Performer.");
  }

  const { data, error } = await db().storage.from(TRACKS_BUCKET).info(path);
  if (error || !data.size) {
    throw new Error("The file didn't finish uploading. Try again.");
  }
  return { sizeBytes: data.size, contentType: AUDIO_CONTENT_TYPES[extension] };
}

export async function prepareNewTrack(
  linkToken: string,
  input: { name: string; filename: string; sizeBytes: number },
) {
  const performer = await requirePerformer(linkToken);
  await ensureTrackNameFree(performer.id, input.name);
  return signedUploadFor(performer, input.filename, input.sizeBytes);
}

export async function saveNewTrack(
  linkToken: string,
  input: { path: string; name: string; filename: string },
) {
  const performer = await requirePerformer(linkToken);
  const file = await uploadedFile(performer, input.path, input.filename);
  const { error } = await db()
    .from("tracks")
    .insert({
      performer_id: performer.id,
      name: input.name,
      filename: input.filename,
      content_type: file.contentType,
      size_bytes: file.sizeBytes,
      storage_path: input.path,
    });
  if (error) {
    await removeObjects([input.path]);
    failed(error, {
      tracks_name_unique: trackNameTaken(input.name),
      tracks_storage_path_key: "That upload was already saved.",
    });
  }
}

export async function prepareReplacement(
  linkToken: string,
  input: { trackId: string; filename: string; sizeBytes: number },
) {
  const performer = await requirePerformer(linkToken);
  await requireTrack(performer, input.trackId);
  return signedUploadFor(performer, input.filename, input.sizeBytes);
}

/** Same Track, new file. The Track name stays; the Filename follows the new file. */
export async function saveReplacement(
  linkToken: string,
  input: { trackId: string; path: string; filename: string },
) {
  const performer = await requirePerformer(linkToken);
  const track = await requireTrack(performer, input.trackId);
  const file = await uploadedFile(performer, input.path, input.filename);

  const { error } = await db()
    .from("tracks")
    .update({
      filename: input.filename,
      content_type: file.contentType,
      size_bytes: file.sizeBytes,
      storage_path: input.path,
    })
    .eq("id", track.id)
    .eq("performer_id", performer.id);
  if (error) {
    await removeObjects([input.path]);
    failed(error, { tracks_storage_path_key: "That upload was already saved." });
  }

  await removeObjects([track.storage_path]);
}

export async function renameTrack(linkToken: string, trackId: string, name: string) {
  const performer = await requirePerformer(linkToken);
  const { data, error } = await db()
    .from("tracks")
    .update({ name })
    .eq("id", trackId)
    .eq("performer_id", performer.id)
    .select("id");
  if (error) failed(error, { tracks_name_unique: trackNameTaken(name) });
  if (data.length === 0) throw new Error(TRACK_GONE);
}

export async function removeTrack(linkToken: string, trackId: string) {
  const performer = await requirePerformer(linkToken);
  const { data, error } = await db()
    .from("tracks")
    .delete()
    .eq("id", trackId)
    .eq("performer_id", performer.id)
    .select("storage_path");
  if (error) failed(error);
  if (data.length === 0) throw new Error(TRACK_GONE);
  await removeObjects(data.map((track) => track.storage_path));
}

export async function performerTrackUrl(linkToken: string, trackId: string, download: boolean) {
  const performer = await requirePerformer(linkToken);
  const track = await requireTrack(performer, trackId);
  return signedTrackUrl(track.storage_path, download ? track.filename : null);
}
