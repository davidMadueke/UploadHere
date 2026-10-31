-- A Track is either an uploaded file or a YouTube link. YouTube rows keep the
-- video id the Performer submitted. Nothing from the video is stored here.

alter table public.tracks
  add column source text not null default 'file',
  add column youtube_video_id text;

alter table public.tracks
  drop constraint tracks_filename_check,
  drop constraint tracks_content_type_check,
  drop constraint tracks_size_bytes_check;

alter table public.tracks
  alter column filename drop not null,
  alter column content_type drop not null,
  alter column size_bytes drop not null,
  alter column storage_path drop not null;

alter table public.tracks
  add constraint tracks_source_check check (source in ('file', 'youtube')),
  add constraint tracks_shape_check check (
    (
      source = 'file'
      and filename is not null
      and char_length(filename) between 1 and 255
      and content_type in ('audio/wav', 'audio/mpeg', 'audio/mp4')
      and size_bytes > 0
      and storage_path is not null
      and youtube_video_id is null
    )
    or (
      source = 'youtube'
      and youtube_video_id is not null
      and youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'
      and filename is null
      and content_type is null
      and size_bytes is null
      and storage_path is null
    )
  );
