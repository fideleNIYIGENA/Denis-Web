import { supabase } from '../config/supabase.js';
import { BUCKETS, uploadFile, deleteFileByUrl } from '../config/storage.js';
import { getPagination } from '../utils/helpers.js';
import { cleanText } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/** GET /api/gallery?page=&limit=&album=&category=&search= */
export const listGallery = asyncHandler(async (req, res) => {
  const { album, category, search } = req.query;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit, 60);

  let query = supabase.from('gallery').select('*', { count: 'exact' });
  if (album) query = query.eq('album', album);
  if (category) query = query.eq('category', category);
  if (search) query = query.or(`caption.ilike.%${search}%,album.ilike.%${search}%`);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data, count: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
});

/** GET /api/gallery/albums */
export const listAlbums = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('gallery').select('album');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const albums = [...new Set((data || []).map((g) => g.album).filter(Boolean))].sort();
  return res.json({ success: true, data: albums });
});

/** GET /api/gallery/categories */
export const listCategories = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('gallery').select('category');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const cats = [...new Set((data || []).map((g) => g.category).filter(Boolean))].sort();
  return res.json({ success: true, data: cats });
});

/** GET /api/gallery/:id */
export const getGalleryItem = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('gallery').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ success: false, message: 'Image not found.' });
  return res.json({ success: true, data });
});

/** POST /api/gallery (multipart: images[]) — one DB row per image. */
export const createGalleryItems = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Select at least one image to upload.' });
  }

  const album = cleanText(req.body.album, 100) || 'General';
  const category = cleanText(req.body.category, 100) || 'Concerts';
  const caption = cleanText(req.body.caption, 300);

  const rows = [];
  for (const file of req.files) {
    const imageUrl = await uploadFile(BUCKETS.GALLERY, 'gallery', file.buffer, file.mimetype);
    rows.push({ album, category, caption, image_url: imageUrl });
  }

  const { data, error } = await supabase.from('gallery').insert(rows).select();
  if (error) {
    for (const r of rows) await deleteFileByUrl(r.image_url);
    return res.status(500).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, message: `${rows.length} image(s) uploaded.`, data });
});

/** PUT /api/gallery/:id (multipart: image optional) */
export const updateGalleryItem = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('gallery').select('*').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Image not found.' });

  const payload = {};
  if (req.body.album !== undefined) payload.album = cleanText(req.body.album, 100) || existing.album;
  if (req.body.category !== undefined) payload.category = cleanText(req.body.category, 100) || existing.category;
  if (req.body.caption !== undefined) payload.caption = cleanText(req.body.caption, 300);
  if (req.file) payload.image_url = await uploadFile(BUCKETS.GALLERY, 'gallery', req.file.buffer, req.file.mimetype);

  const { data, error } = await supabase.from('gallery').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (req.file) await deleteFileByUrl(existing.image_url);
  return res.json({ success: true, message: 'Image updated successfully.', data });
});

/** DELETE /api/gallery/:id */
export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('gallery').select('image_url').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Image not found.' });

  const { error } = await supabase.from('gallery').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  await deleteFileByUrl(existing.image_url);
  return res.json({ success: true, message: 'Image deleted successfully.' });
});
