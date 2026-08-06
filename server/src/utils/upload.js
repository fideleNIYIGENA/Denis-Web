import multer from 'multer';

/**
 * Files are kept in memory and streamed straight to Supabase Storage —
 * nothing is written to the local disk, which keeps the server stateless
 * and ready for platform deploys (Render / Railway / Fly.io).
 */
const storage = multer.memoryStorage();

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const AUDIO_MIMES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a'];

function fileFilter(allowed) {
  return (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error(`Unsupported file type: ${file.mimetype}`);
    err.status = 415;
    return cb(err);
  };
}

/** Multipart form with a single optional image. */
export const singleImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: fileFilter(IMAGE_MIMES),
});

/** Multipart form with a single optional audio file. */
export const singleAudio = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_SIZE, files: 1 },
  fileFilter: fileFilter(AUDIO_MIMES),
});

/** Multipart form for a song: one cover image + one audio file. */
export const songUpload = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_SIZE, files: 2 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover' && IMAGE_MIMES.includes(file.mimetype)) return cb(null, true);
    if (file.fieldname === 'audio' && AUDIO_MIMES.includes(file.mimetype)) return cb(null, true);
    const err = new Error(`Unsupported file type for "${file.fieldname}": ${file.mimetype}`);
    err.status = 415;
    return cb(err);
  },
});

/** Multipart form with up to 20 gallery images. */
export const galleryUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 20 },
  fileFilter: fileFilter(IMAGE_MIMES),
});
