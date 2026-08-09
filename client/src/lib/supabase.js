import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase client for the BROWSER.
 *
 * Only the safe, public configuration is used here:
 *   - VITE_SUPABASE_URL                (project URL)
 *   - VITE_SUPABASE_PUBLISHABLE_KEY    (publishable/anon key — designed to be public)
 *
 * The service_role key must NEVER appear in the frontend. All database reads
 * and writes go through the Express API (service role) in this project.
 */
const url = import.meta.env.VITE_SUPABASE_URL || '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
