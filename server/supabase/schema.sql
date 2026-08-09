-- ============================================================
--  Denis Ndayishimiye — Supabase PostgreSQL Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--  Order matters: tables first, then functions, triggers & indexes.
--  The app uses the Service Role Key, so RLS is disabled defensively
--  on every table (service role bypasses RLS anyway).
--  Every statement is idempotent and safe to re-run.
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
-- 2. SONGS  (music/tracks table)
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
  price_rwf        numeric(12,2) not null default 0,   -- RWF price (0 = no RWF price)
  price_usd        numeric(12,2) not null default 0,   -- USD price (0 = no USD price)
  is_free          boolean not null default true,      -- true = free listening
  play_count       integer not null default 0,
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
  view_count    integer not null default 0,
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
  ticket_price_rwf   numeric(12,2) not null default 0,
  ticket_price_usd   numeric(12,2) not null default 0,
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
  id                     integer primary key default 1 check (id = 1),
  site_name              text not null default 'Denis Ndayishimiye',
  site_tagline           text default '',
  site_description       text default '',
  hero_title             text default 'Denis Ndayishimiye',
  hero_subtitle          text default 'Gospel Artist • Guitarist • Worship Leader',
  hero_image_url         text default '',
  hero_video_url         text default '',
  about_summary          text default '',
  contact_address        text default '',
  payment_methods        jsonb not null default '["mobile_money","card"]',
  momo_number            text,
  momo_merchant_code     text,
  subscription_price_rwf numeric(12,2) not null default 5000,
  subscription_price_usd numeric(12,2) not null default 5,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
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
-- 11. PAYMENTS  (guest checkout: subscriptions, track purchases, event tickets)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  payer_email    text not null,
  payer_phone    text,
  payment_method text not null
                 constraint payments_method_check check (payment_method in ('mobile_money', 'card')),
  amount         numeric(12,2) not null default 0,
  currency       text not null default 'RWF'
                 constraint payments_currency_check check (currency in ('RWF', 'USD')),
  type           text not null
                 constraint payments_type_check check (type in ('subscription', 'track_buy', 'event_ticket')),
  item_id        uuid,                                  -- track or event purchased
  access_token   text unique,                           -- generated on admin approval
  expires_at     timestamptz,                           -- set on approval for subscriptions
  status         text not null default 'pending'
                 constraint payments_status_check check (status in ('pending', 'completed', 'rejected')),
  created_at     timestamptz not null default now()
);

create index if not exists idx_payments_email    on public.payments (payer_email);
create index if not exists idx_payments_type     on public.payments (type);
create index if not exists idx_payments_status   on public.payments (status);
create index if not exists idx_payments_currency on public.payments (currency);
create index if not exists idx_payments_item     on public.payments (item_id);
create index if not exists idx_payments_created  on public.payments (created_at desc);

-- ---------------------------------------------------------------------------
-- 12. IDEMPOTENT MIGRATIONS — safe to re-run on existing deployments.
--     Handles the pre-payments schema (single-currency `price` columns).
-- ---------------------------------------------------------------------------
alter table public.settings add column if not exists payment_methods        jsonb not null default '["mobile_money","card"]';
alter table public.settings add column if not exists momo_number            text;
alter table public.settings add column if not exists momo_merchant_code     text;
alter table public.settings add column if not exists subscription_price_rwf numeric(12,2) not null default 5000;
alter table public.settings add column if not exists subscription_price_usd numeric(12,2) not null default 5;

alter table public.songs add column if not exists price_rwf  numeric(12,2) not null default 0;
alter table public.songs add column if not exists price_usd  numeric(12,2) not null default 0;
alter table public.songs add column if not exists is_free    boolean not null default true;
alter table public.songs add column if not exists play_count integer not null default 0;

alter table public.videos add column if not exists view_count integer not null default 0;
alter table public.videos add column if not exists is_free    boolean not null default true;

alter table public.events add column if not exists ticket_price_rwf numeric(12,2) not null default 0;
alter table public.events add column if not exists ticket_price_usd numeric(12,2) not null default 0;

alter table public.payments add column if not exists currency text not null default 'RWF';

-- Replace the payments status constraint with the approval workflow states.
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check check (status in ('pending', 'completed', 'rejected'));

-- ---------------------------------------------------------------------------
-- 13. LEGACY DATA COPY — move any existing single-currency price values into
--     the new RWF columns so previously-set prices survive the upgrade.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'settings' and column_name = 'subscription_price')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'settings' and column_name = 'subscription_price_rwf') then
    update public.settings set subscription_price_rwf = subscription_price where subscription_price_rwf = 0 and subscription_price > 0;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'songs' and column_name = 'price')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'songs' and column_name = 'price_rwf') then
    update public.songs set price_rwf = price where price_rwf = 0 and price > 0;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'ticket_price')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'ticket_price_rwf') then
    update public.events set ticket_price_rwf = ticket_price where ticket_price_rwf = 0 and ticket_price > 0;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 14. ATOMIC COUNTERS — safe single-statement increments for play/view stats.
-- ---------------------------------------------------------------------------
create or replace function public.increment_song_play(song_id uuid)
returns integer language sql security definer as $$
  update public.songs set play_count = coalesce(play_count, 0) + 1 where id = song_id returning play_count;
$$;

create or replace function public.increment_video_view(video_id uuid)
returns integer language sql security definer as $$
  update public.videos set view_count = coalesce(view_count, 0) + 1 where id = video_id returning view_count;
$$;

-- ---------------------------------------------------------------------------
-- 15. SUBSCRIPTION DEDUPLICATION — one active subscription per email.
-- ---------------------------------------------------------------------------

-- a) Hard constraint: never allow more than one PENDING subscription per email.
--    Prevents double submissions from creating duplicate rows even when two
--    checkout requests race each other.
create unique index if not exists idx_payments_one_pending_subscription
  on public.payments (payer_email)
  where type = 'subscription' and status = 'pending';

-- b) Clean-up routine: remove duplicate subscription records sharing the same
--    email, keeping only the most recent / active record per email.
--    For each email we keep exactly one subscription row — preferring an
--    active (pending/completed) row over a rejected one, newest first — and
--    delete every other subscription row. Idempotent and safe to re-run.
delete from public.payments p
where p.type = 'subscription'
  and p.id not in (
    select distinct on (payer_email) id
    from public.payments
    where type = 'subscription'
    order by payer_email,
             (case when status in ('pending', 'completed') then 1 else 0 end) desc,
             created_at desc
  );

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
alter table public.payments       disable row level security;

-- ---------------------------------------------------------------------------
-- Seed the singleton rows so GET endpoints always have data.
-- ---------------------------------------------------------------------------
insert into public.social_links (id) values (1) on conflict (id) do nothing;
insert into public.settings (id) values (1) on conflict (id) do nothing;
