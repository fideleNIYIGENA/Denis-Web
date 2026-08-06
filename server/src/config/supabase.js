import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client (server side).
 * Uses the Service Role Key so RLS is bypassed. NEVER expose this
 * key to the browser — all requests must go through the Express API.
 */
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export const supabaseAdmin = supabase;
