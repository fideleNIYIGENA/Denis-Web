-- ============================================================
--  Denis Ndayishimiye — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--  Order matters: tables first, then functions, triggers & indexes.
--  The app uses the Service Role Key, so RLS is disabled defensively
--  on every table (service role bypasses RLS anyway).
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. ADMIN  (single administrator account)
-- ---------------------------------------------------------------------------
create table if not exists public.admin (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique
                constraint admin_email_check check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password_hash text not null,
  name          text not null default 'Administrator',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. SONGS
-- ---------------------------------------------------------------------------
create table if not exists public.songs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  description      text,
  genre            text not null default 'Gospel',
  release_date     date,
  featured         boolean not null default false,
  cover_url        text,
  audio_url        text not null,
  spotify_url      text,
  apple_music_url  text,
  boomplay_url     text,
  audiomack_url    text,
  youtube_url      text,
  download_url     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. VIDEOS
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  youtube_url   text not null,
  youtube_id    text not null,
  thumbnail_url text,
  duration      integer not null default 0,        -- seconds
  is_short      boolean not null default false,    -- shorts limited to 60s
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint videos_short_duration_check check (not (is_short = true and duration > 60))
);

-- ---------------------------------------------------------------------------
-- 4. GALLERY
-- ---------------------------------------------------------------------------
create table if not exists public.gallery (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  album      text not null default 'General',
  category   text not null default 'Concerts',
  caption    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. EVENTS
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  event_date         date not null,
  venue              text,
  description        text,
  poster_url         text,
  registration_link  text,
  status             text not null default 'upcoming'
                     constraint events_status_check check (status in ('upcoming', 'past')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. NEWS
-- ---------------------------------------------------------------------------
create table if not exists public.news (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  category        text not null default 'News',
  author          text not null default 'Denis Ndayishimiye',
  published_date  date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. SOCIAL LINKS  (single row, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.social_links (
  id          integer primary key default 1 check (id = 1),
  facebook    text default '',
  instagram   text default '',
  tiktok      text default '',
  youtube     text default '',
  spotify     text default '',
  apple_music text default '',
  boomplay    text default '',
  audiomack   text default '',
  x_twitter   text default '',
  threads     text default '',
  whatsapp    text default '',
  email       text default '',
  phone       text default '',
  website     text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. MESSAGES  (contact form submissions)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. SUBSCRIBERS  (newsletter signups)
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. SETTINGS  (single row, id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id              integer primary key default 1 check (id = 1),
  site_name       text not null default 'Denis Ndayishimiye',
  site_tagline    text default '',
  site_description text default '',
  hero_title      text default 'Denis Ndayishimiye',
  hero_subtitle   text default 'Gospel Artist • Guitarist • Worship Leader',
  hero_image_url  text default '',
  hero_video_url  text default '',
  about_summary   text default '',
  contact_address text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS — keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['admin','songs','videos','gallery','events','news','social_links','messages','settings']
  loop
    execute format(
      'create or replace trigger trg_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- INDEXES — speed up the queries used by the API & search
-- ---------------------------------------------------------------------------
create index if not exists idx_songs_featured      on public.songs (featured);
create index if not exists idx_songs_genre         on public.songs (genre);
create index if not exists idx_songs_release_date  on public.songs (release_date desc);
create index if not exists idx_songs_search        on public.songs using gin (to_tsvector('english', title || ' ' || coalesce(description, '')));

create index if not exists idx_videos_featured   on public.videos (featured);
create index if not exists idx_videos_created    on public.videos (created_at desc);

create index if not exists idx_gallery_album     on public.gallery (album);
create index if not exists idx_gallery_category  on public.gallery (category);

create index if not exists idx_events_status     on public.events (status);
create index if not exists idx_events_date       on public.events (event_date);

create index if not exists idx_news_date         on public.news (published_date desc);
create index if not exists idx_news_category     on public.news (category);
create index if not exists idx_news_slug         on public.news (slug);

create index if not exists idx_messages_read     on public.messages (is_read);
create index if not exists idx_messages_created  on public.messages (created_at desc);
create index if not exists idx_subscribers_email on public.subscribers (email);

-- ---------------------------------------------------------------------------
-- RLS — service role bypasses RLS, but we disable it explicitly so the
-- app keeps working even if a less-privileged key is used by accident.
-- ---------------------------------------------------------------------------
alter table public.admin          disable row level security;
alter table public.songs          disable row level security;
alter table public.videos         disable row level security;
alter table public.gallery        disable row level security;
alter table public.events         disable row level security;
alter table public.news           disable row level security;
alter table public.social_links   disable row level security;
alter table public.messages       disable row level security;
alter table public.subscribers    disable row level security;
alter table public.settings       disable row level security;

-- ---------------------------------------------------------------------------
-- Seed the singleton rows so GET endpoints always have data.
-- ---------------------------------------------------------------------------
insert into public.social_links (id) values (1) on conflict (id) do nothing;
insert into public.settings (id) values (1) on conflict (id) do nothing;
