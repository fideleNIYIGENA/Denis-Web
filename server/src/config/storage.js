import { supabase } from './supabase.js';
import { randomId } from '../utils/helpers.js';

/**
 * Storage buckets used across the application.
 * Must be created before uploads — see server/supabase/storage.sql.
 */
export const BUCKETS = {
  AUDIO: 'audio',
  COVERS: 'covers',
  GALLERY: 'gallery',
  EVENT_POSTERS: 'event-posters',
  NEWS_IMAGES: 'news-images',
  PROFILE: 'profile',
};

/** Fixed paths in the profile bucket — content is upserted in place. */
const PROFILE_IMAGE_PATH = 'profile';
const PROFILE_BIOGRAPHY_PATH = 'biography';

export const PROFILE_IMAGE_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKETS.PROFILE}/${PROFILE_IMAGE_PATH}`;
export const PROFILE_BIOGRAPHY_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKETS.PROFILE}/${PROFILE_BIOGRAPHY_PATH}`;

/**
 * Replace the site's profile picture. The path is fixed so the public URL
 * never changes — every admin upload simply overwrites the previous file.
 */
export async function uploadProfileImage(buffer, mimeType) {
  const { error } = await supabase.storage
    .from(BUCKETS.PROFILE)
    .upload(PROFILE_IMAGE_PATH, buffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Profile image upload failed: ${error.message}`);
  return PROFILE_IMAGE_URL;
}

/**
 * Replace the site's biography text (plain text, newlines preserved).
 * Same fixed-path strategy as the profile image.
 */
export async function uploadBiography(text) {
  const { error } = await supabase.storage
    .from(BUCKETS.PROFILE)
    .upload(PROFILE_BIOGRAPHY_PATH, text, { contentType: 'text/plain; charset=utf-8', upsert: true });
  if (error) throw new Error(`Biography upload failed: ${error.message}`);
  return PROFILE_BIOGRAPHY_URL;
}

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
};

/**
 * Upload a file buffer to a Supabase Storage bucket.
 * @param {string} bucket - bucket name (see BUCKETS)
 * @param {string} folder - logical folder inside the bucket
 * @param {Buffer} buffer - file content
 * @param {string} mimeType - file MIME type
 * @returns {Promise<string>} public URL of the uploaded file
 */
export async function uploadFile(bucket, folder, buffer, mimeType) {
  if (!BUCKETS[bucket.toUpperCase()] && !Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Unknown storage bucket: ${bucket}`);
  }
  const ext = MIME_EXT[mimeType] || 'bin';
  const path = `${folder}/${Date.now()}_${randomId()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Best-effort — failures are swallowed so DB operations still succeed.
 */
export async function deleteFileByUrl(publicUrl) {
  try {
    const parts = publicUrl.split('/');
    const bucket = parts[parts.length - 3];
    const path = parts.slice(parts.length - 2).join('/');
    if (Object.values(BUCKETS).includes(bucket)) {
      await supabase.storage.from(bucket).remove([path]);
    }
  } catch (_) {
    // ignore storage cleanup errors
  }
}

/**
 * Parse the storage path (folder/file) from a public URL so it can be
 * removed later. Returns null when the URL does not belong to our buckets.
 */
export function extractStoragePath(publicUrl) {
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}
