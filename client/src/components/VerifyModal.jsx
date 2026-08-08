import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaXmark, FaCircleCheck, FaClockRotateLeft } from 'react-icons/fa6';
import { FiMail } from 'react-icons/fi';
import api from '../api/client.js';
import { getPayerEmail, setPayerEmail } from '../lib/purchases.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email verification modal for paid tracks.
 *
 * - Asks for the visitor's email (prefilled from localStorage when known).
 * - Calls POST /payments/verify-email with `{ email, track_id }`.
 * - `completed` → `onVerified(email)` (the caller unlocks + plays the track).
 * - `pending`  → shows the "awaiting admin approval" message inline.
 * - `unpaid`   → `onUnpaid(email)` (the caller opens the checkout modal).
 * - When `initialMessage` is set, the modal opens directly on the pending screen.
 */
export default function VerifyModal({ open, onClose, trackId, initialMessage = '', onVerified, onUnpaid }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setEmail(getPayerEmail() || '');
    setMessage(initialMessage);
    setError('');
    setChecking(false);

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, initialMessage, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setChecking(true);
    try {
      const { data } = await api.post('/payments/verify-email', { email: value, track_id: trackId });
      if (data.valid) {
        setPayerEmail(value);
        onVerified?.(value);
      } else if (data.status === 'pending') {
        setMessage(data.message || 'Your payment is awaiting admin approval.');
      } else {
        setPayerEmail(value);
        onUnpaid?.(value);
      }
    } catch {
      setError('Could not verify access. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Verify email access"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-white shadow-glow dark:bg-night-700"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {message ? 'Payment Status' : 'Verify Your Email'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close verification"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <FaXmark className="h-4 w-4" />
              </button>
            </div>

            {message ? (
              <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <FaClockRotateLeft className="h-8 w-8" />
                </span>
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">Almost there</p>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
                <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                  Once the admin confirms receipt of your payment, this email address will be unlocked automatically —
                  no need to pay again.
                </p>
                <button type="button" onClick={onClose} className="btn-primary mt-2">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5 px-6 py-6">
                <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-4 dark:bg-night-800">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <FiMail className="h-5 w-5" />
                  </span>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    We'll check whether this email has approved access to this track. No account is created.
                  </p>
                </div>

                <div>
                  <label className="label" htmlFor="verify-email">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="verify-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500">{error}</p>
                  )}
                </div>

                <button type="submit" disabled={checking} className="btn-primary w-full">
                  {checking ? 'Checking…' : 'Verify & Listen'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
