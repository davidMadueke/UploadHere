# The server is the only Supabase client

There are no accounts, so Supabase Auth has nothing to sign in and row-level policies have no user to check. Every read and write goes through a TanStack Start server function. The function checks the Host link or Performer link, then calls Supabase with the secret key. RLS is on for every table with no policies, and `anon` and `authenticated` have no grants, so the publishable key reads nothing.

Track files go to the private `tracks` bucket by signed upload URL. The server picks the path, the browser PUTs the file straight to Storage, and the server saves the Track row only after it finds the file and reads its size from Storage. Playing and downloading use signed URLs that expire after an hour. This keeps 50 MB WAVs off our server, the same reason Loopinator uploads to Blob from the browser.

The Host link is stored only as a SHA-256 hash, because nobody needs to read it back. The Performer link is stored as-is, because the Host copies it again later.

Calling Supabase from the browser with link checks inside Postgres functions was the alternative. It would put every rule in SQL and expose the Data API to anyone holding the publishable key, so we kept the rules in TypeScript beside the screens that use them.

An upload that never gets saved leaves a file with no Track. Nothing cleans those up yet.
