import { supabase } from '../config/supabase.js';
import { getPagination } from '../utils/helpers.js';
import { cleanText, isEmail, requiredString } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/** POST /api/messages — public contact form. Rate limited at the router. */
export const createMessage = asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name, 100);
  const email = cleanText(req.body.email, 200);
  const subject = cleanText(req.body.subject, 200);
  const message = cleanText(req.body.message, 5000);
  const phone = cleanText(req.body.phone, 50);

  if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
  if (!isEmail(email)) return res.status(400).json({ success: false, message: 'A valid email is required.' });
  if (!subject) return res.status(400).json({ success: false, message: 'Subject is required.' });
  if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

  const { data, error } = await supabase
    .from('messages')
    .insert({ name, email, phone, subject, message, is_read: false })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.status(201).json({ success: true, message: 'Thank you! Your message has been sent.', data });
});

/** POST /api/subscribers — public newsletter signup. */
export const createSubscriber = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 200);
  if (!isEmail(email)) return res.status(400).json({ success: false, message: 'A valid email is required.' });

  const { data: existing } = await supabase.from('subscribers').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existing) return res.json({ success: true, message: 'You are already subscribed.' });

  const { error } = await supabase.from('subscribers').insert({ email: email.toLowerCase() });
  if (error && !/duplicate/i.test(error.message)) {
    return res.status(500).json({ success: false, message: error.message });
  }
  return res.status(201).json({ success: true, message: 'Subscribed! Welcome to the family.' });
});

/** GET /api/messages — admin only. */
export const listMessages = asyncHandler(async (req, res) => {
  const { search, unread } = req.query;
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit, 100);

  let query = supabase.from('messages').select('*', { count: 'exact' });
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
  if (unread === 'true') query = query.eq('is_read', false);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data, count: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) });
});

/** GET /api/messages/:id — admin only. */
export const getMessage = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('messages').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, data });
});

/** PATCH /api/messages/:id/read — toggle read status. */
export const toggleMessageRead = asyncHandler(async (req, res) => {
  const isRead = req.body.is_read === true || req.body.is_read === 'true';
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: isRead, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error || !data) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, message: 'Message updated.', data });
});

/** DELETE /api/messages/:id */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase.from('messages').select('id').eq('id', req.params.id).maybeSingle();
  if (findError || !existing) return res.status(404).json({ success: false, message: 'Message not found.' });

  const { error } = await supabase.from('messages').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Message deleted successfully.' });
});
