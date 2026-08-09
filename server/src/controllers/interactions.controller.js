import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cleanText } from '../middleware/validate.js';

const CONTENT_TYPES = ['song', 'video'];
const REACTIONS = ['like', 'dislike'];
const MAX_COMMENT_LENGTH = 1000;

const contentTypeTable = (type) => (type === 'song' ? 'songs' : 'videos');

/** Verify a content id actually exists in the songs/videos tables. */
async function contentExists(contentType, contentId) {
  if (!CONTENT_TYPES.includes(contentType) || !contentId) return false;
  const { data } = await supabase
    .from(contentTypeTable(contentType))
    .select('id')
    .eq('id', contentId)
    .maybeSingle();
  return !!data;
}

/** Strip HTML/scripts and normalize whitespace for safe display. */
function sanitizeComment(value) {
  if (typeof value !== 'string') return '';
  const stripped = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, MAX_COMMENT_LENGTH);
}

async function authorsFor(rows) {
  const userIds = [...new Set((rows || []).map((r) => r.user_id).filter(Boolean))];
  if (userIds.length === 0) return new Map();
  const { data } = await supabase.from('profiles').select('id, email, display_name').in('id', userIds);
  return new Map((data || []).map((p) => [p.id, p]));
}

/**
 * Apply a like/dislike toggle for the current user.
 * Returns the resulting reaction ('like' | 'dislike' | null when removed).
 */
async function applyToggle(userId, contentType, contentId, reaction) {
  const { data: existing, error: findError } = await supabase
    .from('content_reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .eq('content_type', contentType)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    if (existing.reaction === reaction) {
      // Clicking the active reaction removes it.
      const { error } = await supabase.from('content_reactions').delete().eq('id', existing.id);
      if (error) throw error;
      return null;
    }
    // Clicking the opposite reaction switches it.
    const { data, error } = await supabase
      .from('content_reactions')
      .update({ reaction, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('reaction')
      .single();
    if (error) throw error;
    return data.reaction;
  }

  const { data, error } = await supabase
    .from('content_reactions')
    .insert({ user_id: userId, content_id: contentId, content_type: contentType, reaction })
    .select('reaction')
    .single();
  if (error) throw error;
  return data.reaction;
}

/**
 * GET /api/reactions/:contentType/:contentId
 * Public reaction counts. Includes the current user's reaction when a valid
 * session token is supplied (optional auth).
 */
export const getReactions = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;
  if (!CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: 'Invalid content type.' });
  }
  if (!(await contentExists(contentType, contentId))) {
    return res.status(404).json({ success: false, message: 'Content not found.' });
  }

  const { data, error } = await supabase
    .from('content_reactions')
    .select('user_id, reaction')
    .eq('content_type', contentType)
    .eq('content_id', contentId);
  if (error) return res.status(500).json({ success: false, message: error.message });

  let likes = 0;
  let dislikes = 0;
  for (const row of data || []) {
    if (row.reaction === 'like') likes += 1;
    else dislikes += 1;
  }

  let userReaction = null;
  if (req.user) {
    userReaction = (data || []).find((r) => r.user_id === req.user.id)?.reaction || null;
  }

  return res.json({ success: true, data: { likes, dislikes, user_reaction: userReaction } });
});

/**
 * POST /api/reactions — set / toggle a reaction (authenticated + subscribed).
 * Body: { content_type, content_id, reaction }
 */
export const setReaction = asyncHandler(async (req, res) => {
  const contentType = cleanText(req.body.content_type, 20);
  const contentId = cleanText(req.body.content_id, 100);
  const reaction = cleanText(req.body.reaction, 10);

  if (!CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: 'Invalid content type.' });
  }
  if (!REACTIONS.includes(reaction)) {
    return res.status(400).json({ success: false, message: 'Invalid reaction.' });
  }
  if (!contentId) {
    return res.status(400).json({ success: false, message: 'A content id is required.' });
  }
  if (!(await contentExists(contentType, contentId))) {
    return res.status(404).json({ success: false, message: 'Content not found.' });
  }

  try {
    const result = await applyToggle(req.user.id, contentType, contentId, reaction);
    return res.json({ success: true, reaction: result });
  } catch (error) {
    // Race on the unique constraint: retry the toggle once.
    if (error.code === '23505') {
      try {
        const result = await applyToggle(req.user.id, contentType, contentId, reaction);
        return res.json({ success: true, reaction: result });
      } catch (retryError) {
        return res.status(500).json({ success: false, message: retryError.message });
      }
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/reactions/:id — remove a reaction (only the owner).
 */
export const deleteReaction = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('content_reactions')
    .select('id, user_id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ success: false, message: findError.message });
  if (!existing) return res.status(404).json({ success: false, message: 'Reaction not found.' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only remove your own reaction.' });
  }

  const { error } = await supabase.from('content_reactions').delete().eq('id', existing.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Reaction removed.' });
});

/**
 * GET /api/comments/:contentType/:contentId
 * Public comment list (newest first) with author info.
 */
export const listComments = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;
  if (!CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: 'Invalid content type.' });
  }
  if (!(await contentExists(contentType, contentId))) {
    return res.status(404).json({ success: false, message: 'Content not found.' });
  }

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ success: false, message: error.message });

  const authors = await authorsFor(data);
  const rows = (data || []).map((c) => {
    const author = authors.get(c.user_id) || {};
    return {
      id: c.id,
      content_id: c.content_id,
      content_type: c.content_type,
      comment: c.comment,
      created_at: c.created_at,
      user_id: c.user_id,
      author_email: author.email || '',
      author_display_name: author.display_name || '',
    };
  });

  return res.json({ success: true, data: rows });
});

/**
 * POST /api/comments — create a comment (authenticated + subscribed).
 * Body: { content_type, content_id, comment }
 */
export const createComment = asyncHandler(async (req, res) => {
  const contentType = cleanText(req.body.content_type, 20);
  const contentId = cleanText(req.body.content_id, 100);
  const comment = sanitizeComment(req.body.comment);

  if (!CONTENT_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: 'Invalid content type.' });
  }
  if (!contentId) {
    return res.status(400).json({ success: false, message: 'A content id is required.' });
  }
  if (!comment) {
    return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({ success: false, message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` });
  }
  if (!(await contentExists(contentType, contentId))) {
    return res.status(404).json({ success: false, message: 'Content not found.' });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: req.user.id, content_id: contentId, content_type: contentType, comment })
    .select('*')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  const authors = await authorsFor([data]);
  const author = authors.get(data.user_id) || {};
  return res.status(201).json({
    success: true,
    data: {
      id: data.id,
      content_id: data.content_id,
      content_type: data.content_type,
      comment: data.comment,
      created_at: data.created_at,
      user_id: data.user_id,
      author_email: author.email || '',
      author_display_name: author.display_name || '',
    },
  });
});

/**
 * DELETE /api/comments/:id — delete a comment (only the owner).
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ success: false, message: findError.message });
  if (!existing) return res.status(404).json({ success: false, message: 'Comment not found.' });
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
  }

  const { error } = await supabase.from('comments').delete().eq('id', existing.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Comment deleted.' });
});

/* ------------------------------------------------------------------ */
/* Admin moderation (mounted under /api/admin) — separate admin JWT.  */
/* ------------------------------------------------------------------ */

/**
 * GET /api/admin/comments — list recent comments across all content,
 * optionally filtered by search text or content type.
 */
export const adminListComments = asyncHandler(async (req, res) => {
  const search = cleanText(req.query.search, 200) || '';
  const type = cleanText(req.query.content_type, 20);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);

  let query = supabase.from('comments').select('*', { count: 'exact' });
  if (search) query = query.or(`comment.ilike.%${search}%`);
  if (CONTENT_TYPES.includes(type)) query = query.eq('content_type', type);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(0, limit - 1);
  if (error) return res.status(500).json({ success: false, message: error.message });

  const authors = await authorsFor(data);
  const rows = (data || []).map((c) => {
    const author = authors.get(c.user_id) || {};
    return {
      id: c.id,
      content_id: c.content_id,
      content_type: c.content_type,
      comment: c.comment,
      created_at: c.created_at,
      user_id: c.user_id,
      author_email: author.email || '',
      author_display_name: author.display_name || '',
    };
  });

  return res.json({ success: true, count: count || 0, data: rows });
});

/**
 * DELETE /api/admin/comments/:id — delete any comment (moderation).
 */
export const adminDeleteComment = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('comments')
    .select('id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ success: false, message: findError.message });
  if (!existing) return res.status(404).json({ success: false, message: 'Comment not found.' });

  const { error } = await supabase.from('comments').delete().eq('id', existing.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Comment deleted.' });
});
