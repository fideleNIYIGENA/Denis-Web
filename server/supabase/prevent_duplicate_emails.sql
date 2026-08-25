-- ============================================================
--  Denis Ndayishimiye — Prevent Duplicate Email Registrations
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
--  This migration:
--    1. Deduplicates profiles that share the same email (case-insensitive)
--    2. Adds a unique functional index on lower(email)
--    3. Updates the handle_new_user() trigger to gracefully handle
--       any edge case where the email already exists
--
--  IMPORTANT: Run this AFTER public_users.sql
-- ============================================================

-- STEP 1: Identify and remove duplicate profile rows.
-- When multiple profiles share the same normalized email, keep
-- the one with the earliest created_at and remove the rest.
-- This also cleans up orphaned auth.users that should not exist,
-- but we only touch the profiles table here for safety.

WITH normalized AS (
  SELECT id, lower(email) AS email_lower, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY lower(email)
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.profiles
)
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM normalized WHERE rn > 1
);

-- STEP 2: Drop the existing UNIQUE constraint on email (case-sensitive)
-- and replace it with a unique functional index (case-insensitive).
-- The existing `email text not null unique` in the table definition creates
-- a case-sensitive unique constraint. We drop it and add a case-insensitive one.

DO $$
BEGIN
  -- Drop the existing unique constraint (it is case-sensitive).
  -- The constraint name follows PostgreSQL's auto-generated naming:
  -- <table>_<column>_key
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_email_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_email_key;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint may already be named differently or not exist.
    RAISE NOTICE 'Could not drop profiles_email_key: %', SQLERRM;
END $$;

-- STEP 3: Add a unique functional index on lower(email).
-- This enforces case-insensitive email uniqueness at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower_unique
  ON public.profiles (lower(email));

-- STEP 4: Update the handle_new_user() trigger to handle edge cases.
-- If a profile with the same email (case-insensitive) already exists
-- (e.g., from a race condition or manual auth.users insert), link it
-- to the new auth user instead of failing.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing_profile RECORD;
BEGIN
  -- Try the normal insert first.
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, updated_at = now();

  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Another profile row already has this normalized email.
    -- Link that existing profile to this new auth user.
    SELECT id INTO existing_profile
      FROM public.profiles
      WHERE lower(email) = lower(new.email)
      LIMIT 1;

    IF existing_profile IS NOT NULL THEN
      UPDATE public.profiles
        SET id = new.id, updated_at = now()
        WHERE id = existing_profile.id;
    END IF;

    RETURN new;
END;
$$;
