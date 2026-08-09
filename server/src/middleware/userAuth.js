import { supabase } from '../config/supabase.js';
import { getUserSubscription } from '../utils/subscription.js';

/**
 * Extract a Bearer token from the Authorization header.
 */
function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

/**
 * Public-user auth guard. Verifies the Supabase JWT (GoTrue) via the
 * service-role client. NEVER trusts a user id sent from the browser — the
 * authenticated identity always comes from the verified token.
 */
export async function userAuthRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
    req.user = data.user;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}

/**
 * Optional user auth — attaches `req.user` when a valid token is present,
 * otherwise continues anonymously. Used by public read endpoints that want to
 * return user-specific state (e.g. the current user's reaction).
 */
export async function userAuthOptional(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) req.user = data.user;
    } catch {
      // ignore invalid tokens on optional auth
    }
  }
  return next();
}

/**
 * Requires an ACTIVE subscription in addition to authentication.
 * Must be mounted after `userAuthRequired`.
 */
export async function requireSubscription(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    const subscription = await getUserSubscription(req.user);
    if (subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'An active subscription is required to interact with songs and videos.',
      });
    }
    req.subscription = subscription;
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not verify subscription status.' });
  }
}
