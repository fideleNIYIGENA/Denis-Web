-- ============================================================
--  Denis Ndayishimiye — Public User Accounts Migration
--  Run this in: Supabase Dashboard → SQL Editor → New query
--  AFTER server/supabase/schema.sql (it only adds new tables,
--  it never modifies the existing admin / content tables).
-- ============================================================
--  Adds:
--    1. profiles            — per-auth-user public profile row
--    2. content_reactions   — one like/dislike per user + content
--    3. comments            — user comments on songs & videos
--    4. payments.user_id    — links subscriptions to auth users
--    5. RLS policies        — row level security on all new tables
--    6. auto-create profile trigger on auth.users signup
--  Every statement is idempotent and safe to re-run.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES  (one row per Supabase Auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text not null default '',
  avatar_url    text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. CONTENT REACTIONS  (like / dislike on songs & videos)
--    A unique constraint guarantees one reaction per user + content.
-- ---------------------------------------------------------------------------
create table if not exists public.content_reactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  content_id   uuid not null,
  content_type text not null
               constraint reactions_type_check check (content_type in ('song', 'video')),
  reaction     text not null
               constraint reactions_reaction_check check (reaction in ('like', 'dislike')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint uq_content_reactions_unique unique (user_id, content_id, content_type)
);

-- ---------------------------------------------------------------------------
-- 3. COMMENTS  (user comments on songs & videos)
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  content_id   uuid not null,
  content_type text not null
               constraint comments_type_check check (content_type in ('song', 'video')),
  comment      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. PAYMENTS — link subscriptions to the authenticated user.
--    Guest subscriptions keep a NULL user_id and work via payer_email.
-- ---------------------------------------------------------------------------
alter table public.payments add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------------
-- TRIGGERS — auto-create a profile row when an auth user signs up, and keep
-- the updated_at columns fresh on the new tables.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_on_auth_signup on auth.users;
create trigger trg_profiles_on_auth_signup
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare t text;
begin
  foreach t in array array['profiles', 'content_reactions', 'comments']
  loop
    execute format(
      'create or replace trigger trg_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- INDEXES — speed up the queries used by the API.
-- ---------------------------------------------------------------------------
create index if not exists idx_reactions_content on public.content_reactions (content_type, content_id);
create index if not exists idx_reactions_user    on public.content_reactions (user_id);
create index if not exists idx_comments_content  on public.comments (content_type, content_id, created_at desc);
create index if not exists idx_comments_user     on public.comments (user_id);
create index if not exists idx_payments_user     on public.payments (user_id);

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--    The Express API uses the service_role key (RLS bypassed). These policies
--    still enforce the rules for any anon/authenticated (browser) access, so
--    a public user can never read or modify another user's private data.
-- ---------------------------------------------------------------------------

-- PROFILES: users can read + update only their own profile.
alter table public.profiles enable row level security;
drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- CONTENT REACTIONS: counts are public; create/update/delete own only.
alter table public.content_reactions enable row level security;
drop policy if exists "Anyone can read reactions" on public.content_reactions;
create policy "Anyone can read reactions" on public.content_reactions
  for select using (true);
drop policy if exists "Users insert own reactions" on public.content_reactions;
create policy "Users insert own reactions" on public.content_reactions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users update own reactions" on public.content_reactions;
create policy "Users update own reactions" on public.content_reactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users delete own reactions" on public.content_reactions;
create policy "Users delete own reactions" on public.content_reactions
  for delete to authenticated using (user_id = auth.uid());

-- COMMENTS: lists are public; create/update/delete own only.
alter table public.comments enable row level security;
drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments" on public.comments
  for select using (true);
drop policy if exists "Users insert own comments" on public.comments;
create policy "Users insert own comments" on public.comments
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users update own comments" on public.comments;
create policy "Users update own comments" on public.comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users delete own comments" on public.comments;
create policy "Users delete own comments" on public.comments
  for delete to authenticated using (user_id = auth.uid());

-- PAYMENTS: authenticated users may read only their own subscription rows.
-- Inserts/updates/deletes are handled exclusively by the server (service role).
alter table public.payments enable row level security;
drop policy if exists "Users view own subscriptions" on public.payments;
create policy "Users view own subscriptions" on public.payments
  for select to authenticated
  using (user_id = auth.uid() or payer_email = (auth.jwt() ->> 'email'));
