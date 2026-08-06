import { supabase } from '../config/supabase.js';
import { BUCKETS, uploadFile, deleteFileByUrl } from '../config/storage.js';
import { getPagination, slugify } from '../utils/helpers.js';
import { cleanText } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/** GET /api/news?page=&limit=&search=&category= */
export const listNews = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit, 60);

  let query = supabase.from('news').select('*', { count: 'exact' });
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`);
  if (category) query = query.eq('category', category);

  const { data, count, error } = await query.order('published_date', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data, count: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
});

/** GET /api/news/latest — recent articles for the home page. */
export const listLatest = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('news').select('*').order('published_date', { ascending: false }).limit(3);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
});

/** GET /api/news/categories */
export const listCategories = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('news').select('category');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const cats = [...new Set((data || []).map((n) => n.category).filter(Boolean))].sort();
  return res.json({ success: true, data: cats });
});

/** GET /api/news/:slug */
export const getNews = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('news').select('*').eq('slug', req.params.slug).maybeSingle();
  if (error || !data) return res.status(404).json({ success: false, message: 'Article not found.' });
  return res.json({ success: true, data });
});

/** POST /api/news (multipart: image optional) */
export const createNews = asyncHandler(async (req, res) => {
  const title = cleanText(req.body.title, 200);
  if (!title) return res.status(400).json({ success: false, message: 'News title is required.' });

  const baseSlug = slugify(title) || `article-${Date.now()}`;
  const imageUrl = req.file ? await uploadFile(BUCKETS.NEWS_IMAGES, 'news', req.file.buffer, req.file.mimetype) : null;

  const payload = {
    title,
    slug: baseSlug,
    description: cleanText(req.body.description, 20000),
    category: cleanText(req.body.category, 100) || 'News',
    author: cleanText(req.body.author, 100) || 'Denis Ndayishimiye',
    published_date: req.body.published_date || new Date().toISOString().slice(0, 10),
    image_url: imageUrl,
  };

  const { data, error } = await supabase.from('news').insert(payload).select().single();
  if (error) {
    if (imageUrl) await deleteFileByUrl(imageUrl);
    return res.status(500).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, message: 'Article created successfully.', data });
});

/** PUT /api/news/:id */
export const updateNews = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('news').select('*').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Article not found.' });

  const payload = {};
  if (req.body.title) {
    payload.title = cleanText(req.body.title, 200);
    payload.slug = slugify(payload.title);
  }
  if (req.body.description !== undefined) payload.description = cleanText(req.body.description, 20000);
  if (req.body.category !== undefined) payload.category = cleanText(req.body.category, 100) || existing.category;
  if (req.body.author !== undefined) payload.author = cleanText(req.body.author, 100) || existing.author;
  if (req.body.published_date) payload.published_date = req.body.published_date;
  if (req.file) payload.image_url = await uploadFile(BUCKETS.NEWS_IMAGES, 'news', req.file.buffer, req.file.mimetype);

  const { data, error } = await supabase.from('news').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (req.file && existing.image_url) await deleteFileByUrl(existing.image_url);
  return res.json({ success: true, message: 'Article updated successfully.', data });
});

/** DELETE /api/news/:id */
export const deleteNews = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('news').select('image_url').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Article not found.' });

  const { error } = await supabase.from('news').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (existing.image_url) await deleteFileByUrl(existing.image_url);
  return res.json({ success: true, message: 'Article deleted successfully.' });
});
