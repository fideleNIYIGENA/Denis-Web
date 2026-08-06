import { supabase } from '../config/supabase.js';
import { cleanText, isUrl } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const SOCIAL_FIELDS = [
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'spotify',
  'apple_music',
  'boomplay',
  'audiomack',
  'x_twitter',
  'threads',
  'whatsapp',
  'email',
  'phone',
  'website',
];

const SOCIAL_DEFAULTS = Object.fromEntries(SOCIAL_FIELDS.map((f) => [f, '']));

/** GET /api/social-links — returns the single settings row (id = 1). */
export const getSocialLinks = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('social_links').select('*').eq('id', 1).maybeSingle();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data: { id: 1, ...SOCIAL_DEFAULTS, ...(data || {}) } });
});

/** PUT /api/social-links — upsert the single row. Admin only. */
export const updateSocialLinks = asyncHandler(async (req, res) => {
  const payload = {};
  for (const field of SOCIAL_FIELDS) {
    if (req.body[field] === undefined) continue;
    const value = cleanText(req.body[field], 500);
    if (value && field !== 'email' && field !== 'phone' && !isUrl(value)) {
      return res.status(400).json({ success: false, message: `Invalid URL for ${field.replace('_', ' ')}.` });
    }
    payload[field] = value;
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('social_links')
    .upsert({ id: 1, ...payload }, { onConflict: 'id' })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Social links updated successfully.', data });
});
