import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { cleanText } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(admin) {
  return jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

const publicAdmin = (a) => ({
  id: a.id,
  name: a.name,
  username: process.env.ADMIN_USERNAME || a.email,
  email: a.email,
  role: 'admin',
  created_at: a.created_at,
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const username = cleanText(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const configuredUsername = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const configuredEmail = (process.env.ADMIN_EMAIL || 'admin@denisweb.local').trim().toLowerCase();

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username !== configuredUsername && username !== configuredEmail) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const { data, error } = await supabase
    .from('admin')
    .select('*')
    .eq('email', configuredEmail)
    .maybeSingle();

  if (error || !data) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = signToken(data);
  return res.json({
    success: true,
    message: 'Login successful.',
    token,
    admin: publicAdmin(data),
  });
});

/** POST /api/auth/logout — stateless JWT, client discards the token. */
export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('admin')
    .select('id, name, email, created_at')
    .eq('id', req.admin.id)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Administrator not found.' });
  }
  return res.json({ success: true, admin: publicAdmin(data) });
});

/** PUT /api/auth/password — change password while logged in. */
export const changePassword = asyncHandler(async (req, res) => {
  const current = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const next = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

  if (current.length < 8) {
    return res.status(400).json({ success: false, message: 'Current password is invalid.' });
  }
  if (next.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }
  if (next === current) {
    return res.status(400).json({ success: false, message: 'New password must be different from the current password.' });
  }

  const { data, error } = await supabase
    .from('admin')
    .select('password_hash')
    .eq('id', req.admin.id)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'Administrator not found.' });
  }

  const valid = await bcrypt.compare(current, data.password_hash);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  const password_hash = await bcrypt.hash(next, 12);
  const { error: updateError } = await supabase
    .from('admin')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', req.admin.id);

  if (updateError) {
    return res.status(500).json({ success: false, message: updateError.message });
  }

  return res.json({ success: true, message: 'Password updated successfully.' });
});
