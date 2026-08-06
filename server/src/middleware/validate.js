/**
 * Lightweight validation + sanitization helpers.
 * Sanitization strips HTML to mitigate stored XSS from admin inputs.
 */

export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isUrl = (v) => {
  if (!v) return true; // optional
  return typeof v === 'string' && /^https?:\/\/[^\s]+$/i.test(v.trim());
};

export const requiredString = (v, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

/** Strip tags + collapse whitespace. */
export const sanitize = (v) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim() : '');

/** Strip dangerous characters from text-ish fields. */
export const cleanText = (v, max = 500) => {
  if (v === undefined || v === null) return undefined;
  const cleaned = sanitize(String(v));
  return cleaned.slice(0, max);
};

/** Keep only safe fields of a payload. */
export function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}
