import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const PER_PAGE = 1000;
const MAX_PAGES = 50;

/** Human-readable account status derived from safe Supabase Auth fields. */
function statusOf(user) {
  if (user.deleted_at) return 'deleted';
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) return 'banned';
  if (user.email_confirmed_at) return 'active';
  return 'pending';
}

/**
 * GET /api/admin/accounts — list every registered account for the admin.
 *
 * Account rows come from Supabase Auth (auth.users), the source of truth.
 * Only NON-SENSITIVE fields are returned: never password hashes, tokens or
 * service-role credentials. The Service Role Key stays on the server and this
 * route is protected by authRequired (admin JWT only).
 */
export const listAccounts = asyncHandler(async (req, res) => {
  // display_name / avatar_url live in public.profiles (mirrors auth.users via trigger).
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url');
  if (profilesError) return res.status(500).json({ success: false, message: profilesError.message });

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const accounts = [];
  let page = 1;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) return res.status(500).json({ success: false, message: error.message });

    const batch = data?.users || [];
    for (const u of batch) {
      const profile = profileById.get(u.id);
      accounts.push({
        id: u.id,
        email: u.email || '',
        display_name: profile?.display_name || '',
        avatar_url: profile?.avatar_url || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
        status: statusOf(u),
      });
    }

    if (batch.length < PER_PAGE) break;
    page += 1;
    if (page > MAX_PAGES) break;
  }

  accounts.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return res.json({
    success: true,
    data: { total: accounts.length, accounts },
  });
});
