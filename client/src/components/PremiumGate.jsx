import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCrown, FaRightToBracket, FaLock } from 'react-icons/fa6';
import { FiX } from 'react-icons/fi';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';

/**
 * Full-screen prompt shown when a visitor tries to open PREMIUM content
 * without the required login + active subscription.
 *
 * - Not logged in  → "Please log in and subscribe…" with Login + Subscribe.
 * - Logged in only  → "Subscribe to access this premium content…" with Subscribe.
 */
export default function PremiumGate({ open, onClose, contentType = 'song' }) {
  const { isAuthenticated } = useUserAuth();
  const label = contentType === 'video' ? 'video' : 'song';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Premium content locked"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-glass dark:bg-night-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15">
              <FaLock className="h-7 w-7 text-gold" />
            </div>

            <h3 className="mt-5 font-display text-xl font-bold text-slate-900 dark:text-white">Premium Content</h3>

            {isAuthenticated ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  This {label} is premium. Subscribe to listen to all premium songs and watch every premium video.
                </p>
                <Link to="/subscribe" className="btn-primary mt-6 w-full">
                  <FaCrown className="h-4 w-4" /> Subscribe
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Please log in and subscribe to access this premium content.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Link to="/login" className="btn-primary w-full">
                    <FaRightToBracket className="h-4 w-4" /> Login
                  </Link>
                  <Link to="/subscribe" className="btn-outline w-full border-gold text-gold hover:bg-gold/10">
                    <FaCrown className="h-4 w-4" /> Subscribe
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
