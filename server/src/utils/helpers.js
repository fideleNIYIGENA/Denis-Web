import crypto from 'crypto';

/** Generate a short random id (for storage paths, slugs, etc). */
export const randomId = (len = 8) =>
  crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);

/** Build a URL-safe slug from a title. */
export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Compute offset/limit for a paginated query. */
export const getPagination = (page, limit, maxLimit = 100) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(Math.max(1, parseInt(limit, 10) || 12), maxLimit);
  return { page: p, limit: l, offset: (p - 1) * l };
};

/** Normalize a YouTube URL into the bare video id. Returns null when invalid. */
export function extractYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/** Convert a JS Date to ISO string (yyyy-mm-dd) for the schema. */
export const toISODate = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

/** Read current origin from request for absolute URLs. */
export const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;
