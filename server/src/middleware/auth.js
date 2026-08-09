import jwt from 'jsonwebtoken';

/**
 * Express middleware that protects admin-only routes.
 * Expects `Authorization: Bearer <token>`.
 */
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only tokens issued by the admin login carry the 'admin' role. This
    // guarantees a public-user token can never reach an admin handler.
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    req.admin = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}
