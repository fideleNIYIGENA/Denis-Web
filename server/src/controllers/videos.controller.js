import { supabase } from '../config/supabase.js';
import { BUCKETS, uploadFile, deleteFileByUrl } from '../config/storage.js';
import { getPagination, extractYouTubeId } from '../utils/helpers.js';
import { cleanText } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const ytThumb = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

function parseDuration(raw) {
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return null;
}

/** GET /api/videos?page=&limit=&search=&featured= */
export const listVideos = asyncHandler(async (req, res) => {
  const { search, featured } = req.query;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit, 60);

  let query = supabase.from('videos').select('*', { count: 'exact' });
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (featured === 'true') query = query.eq('featured', true);

  const { data, count, error } = await query
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data, count: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
});

/** GET /api/videos/featured */
export const listFeatured = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('videos').select('*').eq('featured', true).order('created_at', { ascending: false }).limit(1);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data: data || [] });
});

/** GET /api/videos/:id */
export const getVideo = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('videos').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ success: false, message: 'Video not found.' });
  return res.json({ success: true, data });
});

/** POST /api/videos (multipart: thumbnail optional) */
export const createVideo = asyncHandler(async (req, res) => {
  const title = cleanText(req.body.title, 200);
  const youtubeUrl = cleanText(req.body.youtube_url, 500);
  if (!title) return res.status(400).json({ success: false, message: 'Video title is required.' });

  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) return res.status(400).json({ success: false, message: 'A valid YouTube link is required.' });

  const duration = parseDuration(req.body.duration);
  const isShort = req.body.is_short === 'true' || req.body.is_short === true;
  if (isShort && duration && duration > 60) {
    return res.status(400).json({ success: false, message: 'Short videos must be at most 1 minute (60 seconds).' });
  }

  const thumbUrl = req.file
    ? await uploadFile(BUCKETS.NEWS_IMAGES, 'videos', req.file.buffer, req.file.mimetype)
    : ytThumb(youtubeId);

  const payload = {
    title,
    description: cleanText(req.body.description, 5000),
    youtube_url: youtubeUrl,
    youtube_id: youtubeId,
    thumbnail_url: thumbUrl,
    duration: duration ?? 0,
    is_short: isShort,
    featured: req.body.featured === 'true' || req.body.featured === true,
    is_free: req.body.is_free === 'false' || req.body.is_free === false ? false : true,
  };

  const { data, error } = await supabase.from('videos').insert(payload).select().single();
  if (error) {
    if (req.file) await deleteFileByUrl(thumbUrl);
    return res.status(500).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, message: 'Video created successfully.', data });
});

/** PUT /api/videos/:id */
export const updateVideo = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('videos').select('*').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Video not found.' });

  const payload = {};
  if (req.body.title) payload.title = cleanText(req.body.title, 200);
  if (req.body.description !== undefined) payload.description = cleanText(req.body.description, 5000);
  if (req.body.duration) payload.duration = parseDuration(req.body.duration) ?? existing.duration;
  if (req.body.featured !== undefined) payload.featured = req.body.featured === 'true' || req.body.featured === true;
  if (req.body.is_short !== undefined) payload.is_short = req.body.is_short === 'true' || req.body.is_short === true;
  if (req.body.is_free !== undefined) payload.is_free = req.body.is_free === 'true' || req.body.is_free === true;

  if (payload.is_short && payload.duration && payload.duration > 60) {
    return res.status(400).json({ success: false, message: 'Short videos must be at most 1 minute (60 seconds).' });
  }

  if (req.body.youtube_url) {
    const youtubeId = extractYouTubeId(req.body.youtube_url);
    if (!youtubeId) return res.status(400).json({ success: false, message: 'A valid YouTube link is required.' });
    payload.youtube_url = req.body.youtube_url;
    payload.youtube_id = youtubeId;
  }

  if (req.file) payload.thumbnail_url = await uploadFile(BUCKETS.NEWS_IMAGES, 'videos', req.file.buffer, req.file.mimetype);

  const { data, error } = await supabase.from('videos').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  if (req.file && existing.thumbnail_url && existing.thumbnail_url.startsWith('http')) {
    await deleteFileByUrl(existing.thumbnail_url);
  }
  return res.json({ success: true, message: 'Video updated successfully.', data });
});

/** DELETE /api/videos/:id */
export const deleteVideo = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('videos').select('thumbnail_url').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Video not found.' });

  const { error } = await supabase.from('videos').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (existing.thumbnail_url) await deleteFileByUrl(existing.thumbnail_url);
  return res.json({ success: true, message: 'Video deleted successfully.' });
});
