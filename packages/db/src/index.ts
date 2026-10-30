import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@uploadhere/env/server";

import type { Database } from "./database.types";

export type { Database, Tables } from "./database.types";

/** Private bucket holding every Track file. Paths are `{gigId}/{performerId}/{uuid}.{ext}`. */
export const TRACKS_BUCKET = "tracks";

let client: SupabaseClient<Database> | undefined;

/** Server-only Supabase client on the secret key. Never import this from browser code. */
export function db(): SupabaseClient<Database> {
  client ??= createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
