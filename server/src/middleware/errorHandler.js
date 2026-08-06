/** 404 handler for unknown API routes. */
export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Centralized error handler. Never leaks stack traces to clients. */
export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const status = err.status || 500;
  // Expose actionable errors while developing locally; keep production errors
  // generic so implementation details are never leaked to public visitors.
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large.' });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }

  res.status(status).json({ success: false, message });
}

/** Wraps async route handlers so thrown errors reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
