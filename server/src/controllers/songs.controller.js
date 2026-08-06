import { supabase } from '../config/supabase.js';
import { BUCKETS, uploadFile, deleteFileByUrl } from '../config/storage.js';
import { getPagination, slugify } from '../utils/helpers.js';
import { cleanText, isUrl } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const STREAM_FIELDS = [
  'spotify_url',
  'apple_music_url',
  'boomplay_url',
  'audiomack_url',
  'youtube_url',
  'download_url',
];

const sanitizeLinks = (body) => {
  const out = {};
  for (const field of STREAM_FIELDS) {
    const value = cleanText(body[field], 500);
    if (value && !isUrl(value)) throw Object.assign(new Error(`Invalid URL for ${field}.`), { status: 400 });
    out[field] = value || null;
  }
  return out;
};

/** GET /api/songs?page=&limit=&search=&genre=&featured= */
export const listSongs = asyncHandler(async (req, res) => {
  const { search, genre, featured } = req.query;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit, 60);

  let query = supabase.from('songs').select('*', { count: 'exact' });
  if (search) query = query.or(`title.ilike.%${search}%,genre.ilike.%${search}%,description.ilike.%${search}%`);
  if (genre) query = query.eq('genre', genre);
  if (featured === 'true') query = query.eq('featured', true);

  const { data, count, error } = await query
    .order('featured', { ascending: false })
    .order('release_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({
    success: true,
    data,
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
});

/** GET /api/songs/genres — distinct genres for filters. */
export const listGenres = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('songs').select('genre');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const genres = [...new Set((data || []).map((s) => s.genre).filter(Boolean))].sort();
  return res.json({ success: true, data: genres });
});

/** GET /api/songs/featured */
export const listFeatured = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(4);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
});

/** GET /api/songs/:id */
export const getSong = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('songs').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ success: false, message: 'Song not found.' });
  return res.json({ success: true, data });
});

/** POST /api/songs (multipart: cover + audio) */
export const createSong = asyncHandler(async (req, res) => {
  const title = cleanText(req.body.title, 200);
  if (!title) return res.status(400).json({ success: false, message: 'Song title is required.' });

  const coverFile = req.files?.cover?.[0];
  const audioFile = req.files?.audio?.[0];
  if (!audioFile) return res.status(400).json({ success: false, message: 'An audio file is required.' });

  const coverUrl = coverFile ? await uploadFile(BUCKETS.COVERS, 'songs', coverFile.buffer, coverFile.mimetype) : null;
  const audioUrl = await uploadFile(BUCKETS.AUDIO, 'songs', audioFile.buffer, audioFile.mimetype);

  const links = sanitizeLinks(req.body);
  const payload = {
    title,
    slug: slugify(title),
    description: cleanText(req.body.description, 5000),
    genre: cleanText(req.body.genre, 100) || 'Gospel',
    release_date: req.body.release_date || new Date().toISOString().slice(0, 10),
    featured: req.body.featured === 'true' || req.body.featured === true,
    cover_url: coverUrl,
    audio_url: audioUrl,
    ...links,
  };

  const { data, error } = await supabase.from('songs').insert(payload).select().single();
  if (error) {
    await deleteFileByUrl(audioUrl);
    if (coverUrl) await deleteFileByUrl(coverUrl);
    return res.status(500).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, message: 'Song created successfully.', data });
});

/** PUT /api/songs/:id (multipart, files optional) */
export const updateSong = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('songs')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Song not found.' });

  const payload = {};
  if (req.body.title) payload.title = cleanText(req.body.title, 200);
  if (req.body.title) payload.slug = slugify(payload.title);
  if (req.body.description !== undefined) payload.description = cleanText(req.body.description, 5000);
  if (req.body.genre !== undefined) payload.genre = cleanText(req.body.genre, 100) || existing.genre;
  if (req.body.release_date) payload.release_date = req.body.release_date;
  if (req.body.featured !== undefined) payload.featured = req.body.featured === 'true' || req.body.featured === true;

  Object.assign(payload, sanitizeLinks(req.body));

  const coverFile = req.files?.cover?.[0];
  const audioFile = req.files?.audio?.[0];
  if (coverFile) {
    const url = await uploadFile(BUCKETS.COVERS, 'songs', coverFile.buffer, coverFile.mimetype);
    payload.cover_url = url;
  }
  if (audioFile) {
    const url = await uploadFile(BUCKETS.AUDIO, 'songs', audioFile.buffer, audioFile.mimetype);
    payload.audio_url = url;
  }

  const { data, error } = await supabase
    .from('songs')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  // clean up replaced files only after a successful DB update
  if (req.files?.cover && existing.cover_url) await deleteFileByUrl(existing.cover_url);
  if (req.files?.audio && existing.audio_url) await deleteFileByUrl(existing.audio_url);

  return res.json({ success: true, message: 'Song updated successfully.', data });
});

/** DELETE /api/songs/:id */
export const deleteSong = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('songs')
    .select('audio_url, cover_url')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Song not found.' });

  const { error } = await supabase.from('songs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });

  if (existing.audio_url) await deleteFileByUrl(existing.audio_url);
  if (existing.cover_url) await deleteFileByUrl(existing.cover_url);

  return res.json({ success: true, message: 'Song deleted successfully.' });
});
