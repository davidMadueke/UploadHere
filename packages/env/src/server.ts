import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_URL: z.url(),
    /** Publishable key (sb_publishable_...). Safe in a browser: anon has no grants. The
     *  browser sends it with signed uploads so the API gateway lets them through. */
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    /** Secret key (sb_secret_...). Server only: it bypasses RLS. */
    SUPABASE_SECRET_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
