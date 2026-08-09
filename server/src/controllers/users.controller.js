import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cleanText } from '../middleware/validate.js';
import { getUserSubscription } from '../utils/subscription.js';

/** Shape of the profile object returned to the client. */
const publicProfile = (p) => ({
  id: p.id,
  email: p.email,
  display_name: p.display_name || '',
  avatar_url: p.avatar_url || '',
  created_at: p.created_at,
});

/**
 * GET /api/users/profile
 * Returns the authenticated user's public profile plus their subscription
 * status (derived from the payments table). Safe for any authenticated user.
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const email = (req.user.email || '').toLowerCase();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return res.status(500).json({ success: false, message: error.message });

  let profileRow = profile;
  if (!profileRow) {
    // Defensive: the signup trigger should have created this row already.
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId, email })
      .select()
      .single();
    if (createError) return res.status(500).json({ success: false, message: createError.message });
    profileRow = created;
  } else if (profileRow.email !== email) {
    // Keep the email fresh when a user changes their Supabase Auth email.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateError) return res.status(500).json({ success: false, message: updateError.message });
    profileRow = { ...profileRow, email };
  }

  const subscription = await getUserSubscription(req.user);

  return res.json({
    success: true,
    data: { profile: publicProfile(profileRow), subscription },
  });
});

/**
 * PUT /api/users/profile
 * Updates safe profile fields (display_name). The user id always comes from
 * the verified JWT, never from the request body.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const displayName = cleanText(req.body.display_name, 80);

  if (displayName === undefined) {
    return res.status(400).json({ success: false, message: 'Nothing to update.' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Profile updated.', data: publicProfile(data) });
});
