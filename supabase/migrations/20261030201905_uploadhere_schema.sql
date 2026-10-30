-- UploadHere schema. The app server is the only client. Every table has RLS on and no
-- policies, and anon/authenticated have no grants, so the Data API returns nothing without
-- the secret key. See docs/adr/0003-server-is-the-only-supabase-client.md.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  -- SHA-256 of the Host link token. The token itself is never stored.
  host_token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.performers (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  -- Running order. Gaps are allowed; only the sort matters.
  position integer not null check (position >= 0),
  -- Stored as-is because the Host needs to show and copy it again.
  link_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint performers_position_unique unique (gig_id, position) deferrable initially immediate
);

create unique index performers_name_unique on public.performers (gig_id, lower(btrim(name)));

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid not null references public.performers (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  filename text not null check (char_length(filename) between 1 and 255),
  content_type text not null check (content_type in ('audio/wav', 'audio/mpeg', 'audio/mp4')),
  size_bytes bigint not null check (size_bytes > 0),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tracks_name_unique on public.tracks (performer_id, lower(btrim(name)));

create trigger gigs_set_updated_at before update on public.gigs
  for each row execute function public.set_updated_at();
create trigger performers_set_updated_at before update on public.performers
  for each row execute function public.set_updated_at();
create trigger tracks_set_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();

alter table public.gigs enable row level security;
alter table public.performers enable row level security;
alter table public.tracks enable row level security;

revoke all on table public.gigs, public.performers, public.tracks from anon, authenticated;

create function public.set_running_order(p_gig_id uuid, p_performer_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if cardinality(p_performer_ids) <> (select count(distinct x) from unnest(p_performer_ids) as x)
    or cardinality(p_performer_ids) <> (select count(*) from public.performers where gig_id = p_gig_id)
    or exists (
      select 1 from unnest(p_performer_ids) as x
      where not exists (select 1 from public.performers p where p.id = x and p.gig_id = p_gig_id)
    )
  then
    raise exception 'Running order must list every Performer on the Gig once' using errcode = '22023';
  end if;

  set constraints public.performers_position_unique deferred;

  update public.performers p
  set position = o.ord - 1
  from unnest(p_performer_ids) with ordinality as o (id, ord)
  where p.id = o.id and p.gig_id = p_gig_id;
end;
$$;

revoke execute on function public.set_running_order (uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.set_running_order (uuid, uuid[]) to service_role;
revoke execute on function public.set_updated_at () from public, anon, authenticated;

-- 50 MB is the per-file ceiling on the Supabase free plan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tracks', 'tracks', false, 52428800, array['audio/wav', 'audio/mpeg', 'audio/mp4']);
