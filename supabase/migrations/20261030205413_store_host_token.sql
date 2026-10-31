-- The home page lists every Gig and links back to it. The Host link is stored as well as
-- its hash, so a Gig created before this column existed can still be opened. Old links keep
-- working through host_token_hash.

alter table public.gigs add column host_token text;

update public.gigs
set host_token = rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=')
where host_token is null;

alter table public.gigs alter column host_token set not null;
alter table public.gigs add constraint gigs_host_token_unique unique (host_token);
