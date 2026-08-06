import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

/**
 * Seed the single administrator account.
 *
 * Credentials (defaults):
 *   Username: DenisAdmin@web
 *   Password: DenisWeb@2026
 *
 * The password is stored with bcrypt (12 salt rounds).
 * The seed runs automatically when the server starts; it is a no-op when
 * the admin already exists. The username is configured separately from the
 * valid internal email required by the database schema.
 */
export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@denisweb.local').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'DenisWeb@2026';

  const { data: existing } = await supabase
    .from('admin')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    console.log('[seed] Default administrator already exists — skipping.');
    return existing;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('admin')
    .insert({
      email,
      name: 'Denis Ndayishimiye',
      password_hash,
    })
    .select('id, email, name')
    .single();

  if (error) {
    console.error('[seed] Could not create administrator:', error.message);
    throw error;
  }

  console.log(`[seed] Default administrator created: ${data.email}`);
  return data;
}
