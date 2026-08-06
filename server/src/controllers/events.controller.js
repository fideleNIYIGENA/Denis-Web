import { supabase } from '../config/supabase.js';
import { BUCKETS, uploadFile, deleteFileByUrl } from '../config/storage.js';
import { getPagination } from '../utils/helpers.js';
import { cleanText, isUrl } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

function computeStatus(dateStr, override) {
  if (override === 'upcoming' || override === 'past') return override;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'upcoming';
  return d.getTime() >= Date.now() ? 'upcoming' : 'past';
}

/** GET /api/events?page=&limit=&status=&search= */
export const listEvents = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit, 60);

  let query = supabase.from('events').select('*', { count: 'exact' });
  if (status === 'upcoming' || status === 'past') query = query.eq('status', status);
  if (search) query = query.or(`title.ilike.%${search}%,venue.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, count, error } = await query.order('event_date', { ascending: true }).range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data, count: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
});

/** GET /api/events/upcoming — used on the home page. */
export const listUpcoming = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
    .order('event_date', { ascending: true })
    .limit(4);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
});

/** GET /api/events/:id */
export const getEvent = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ success: false, message: 'Event not found.' });
  return res.json({ success: true, data });
});

/** POST /api/events (multipart: poster optional) */
export const createEvent = asyncHandler(async (req, res) => {
  const title = cleanText(req.body.title, 200);
  if (!title) return res.status(400).json({ success: false, message: 'Event title is required.' });
  if (!req.body.event_date) return res.status(400).json({ success: false, message: 'Event date is required.' });

  if (req.body.registration_link && !isUrl(req.body.registration_link)) {
    return res.status(400).json({ success: false, message: 'Invalid registration link.' });
  }

  const posterUrl = req.file ? await uploadFile(BUCKETS.EVENT_POSTERS, 'events', req.file.buffer, req.file.mimetype) : null;

  const payload = {
    title,
    event_date: req.body.event_date,
    venue: cleanText(req.body.venue, 300),
    description: cleanText(req.body.description, 5000),
    registration_link: cleanText(req.body.registration_link, 500) || null,
    status: computeStatus(req.body.event_date, req.body.status),
    poster_url: posterUrl,
  };

  const { data, error } = await supabase.from('events').insert(payload).select().single();
  if (error) {
    if (posterUrl) await deleteFileByUrl(posterUrl);
    return res.status(500).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, message: 'Event created successfully.', data });
});

/** PUT /api/events/:id */
export const updateEvent = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('events').select('*').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Event not found.' });

  if (req.body.registration_link && !isUrl(req.body.registration_link)) {
    return res.status(400).json({ success: false, message: 'Invalid registration link.' });
  }

  const payload = {};
  if (req.body.title) payload.title = cleanText(req.body.title, 200);
  if (req.body.event_date) payload.event_date = req.body.event_date;
  if (req.body.venue !== undefined) payload.venue = cleanText(req.body.venue, 300);
  if (req.body.description !== undefined) payload.description = cleanText(req.body.description, 5000);
  if (req.body.registration_link !== undefined) payload.registration_link = cleanText(req.body.registration_link, 500) || null;
  payload.status = computeStatus(payload.event_date || existing.event_date, req.body.status);
  if (req.file) payload.poster_url = await uploadFile(BUCKETS.EVENT_POSTERS, 'events', req.file.buffer, req.file.mimetype);

  const { data, error } = await supabase.from('events').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (req.file && existing.poster_url) await deleteFileByUrl(existing.poster_url);
  return res.json({ success: true, message: 'Event updated successfully.', data });
});

/** DELETE /api/events/:id */
export const deleteEvent = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('events').select('poster_url').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Event not found.' });

  const { error } = await supabase.from('events').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  if (existing.poster_url) await deleteFileByUrl(existing.poster_url);
  return res.json({ success: true, message: 'Event deleted successfully.' });
});
