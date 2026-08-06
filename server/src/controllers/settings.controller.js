import { supabase } from '../config/supabase.js';
import { cleanText, isUrl } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadProfileImage, uploadBiography, PROFILE_IMAGE_URL, PROFILE_BIOGRAPHY_URL } from '../config/storage.js';

const DEFAULT_SETTINGS = {
  id: 1,
  site_name: 'Denis Ndayishimiye',
  site_tagline: 'Worship • Music • Ministry',
  site_description:
    'Official website of Denis Ndayishimiye — Rwandan Gospel Artist, Guitarist, Singer-Songwriter, Music Producer and Worship Leader.',
  hero_title: 'Denis Ndayishimiye',
  hero_subtitle: 'Gospel Artist • Guitarist • Worship Leader',
  hero_image_url: '',
  hero_video_url: '',
  about_summary: '',
  contact_address: '',
};

/** GET /api/settings */
export const getSettings = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({
    success: true,
    data: {
      ...DEFAULT_SETTINGS,
      ...(data || {}),
      // Fixed storage paths — not DB columns, computed so the client
      // always knows where the current profile picture / biography live.
      profile_image_url: PROFILE_IMAGE_URL,
      biography_url: PROFILE_BIOGRAPHY_URL,
    },
  });
});

/** PUT /api/settings — upsert single row + optional profile image/bio. Admin only. */
export const updateSettings = asyncHandler(async (req, res) => {
  const fields = Object.keys(DEFAULT_SETTINGS).filter((f) => f !== 'id');
  const payload = {};
  for (const field of fields) {
    if (req.body[field] === undefined) continue;
    const value = cleanText(req.body[field], 2000);
    if (value && (field === 'hero_image_url' || field === 'hero_video_url') && !isUrl(value)) {
      return res.status(400).json({ success: false, message: `Invalid URL for ${field}.` });
    }
    payload[field] = value;
  }
  payload.updated_at = new Date().toISOString();

  // Profile picture — replaces the fixed file in storage.
  if (req.file) {
    try {
      await uploadProfileImage(req.file.buffer, req.file.mimetype);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Biography — stored as plain text in storage, newlines preserved.
  if (req.body.bio !== undefined && req.body.bio.trim() !== '') {
    try {
      await uploadBiography(cleanText(req.body.bio, 50000));
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const { data, error } = await supabase.from('settings').upsert({ id: 1, ...payload }, { onConflict: 'id' }).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({
    success: true,
    message: 'Settings updated successfully.',
    data: { ...data, profile_image_url: PROFILE_IMAGE_URL, biography_url: PROFILE_BIOGRAPHY_URL },
  });
});
