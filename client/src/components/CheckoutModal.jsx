import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMobileScreenButton, FaCreditCard, FaXmark, FaCircleCheck } from 'react-icons/fa6';
import { FiLock } from 'react-icons/fi';
import api from '../api/client.js';
import { getCredentials, setCredentials } from '../lib/purchases.js';
import { formatMoney } from '../lib/format.js';

const METHODS = [
  { key: 'mobile_money', label: 'Mobile Money', icon: FaMobileScreenButton, hint: 'MTN Mobile Money / Airtel Money' },
  { key: 'card', label: 'Card', icon: FaCreditCard, hint: 'Debit / credit card' },
];

const TYPE_LABEL = {
  subscription: 'Full Access Subscription',
  track_buy: 'Buy Track',
  event_ticket: 'Event Ticket',
};

function amountFor(type, item, subscriptionPrice) {
  if (type === 'subscription') return subscriptionPrice;
  if (type === 'track_buy') return Number(item?.price || 0);
  if (type === 'event_ticket') return Number(item?.ticket_price || 0);
  return 0;
}

/**
 * Guest checkout modal. Works without an account: the buyer enters an email
 * (and phone for Mobile Money), pays, and receives an access token that is
 * saved to localStorage to unlock content on this device.
 */
export default function CheckoutModal({ open, onClose, type = 'subscription', item = null, onSuccess }) {
  const [methods, setMethods] = useState([]);
  const [momoNumber, setMomoNumber] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState(0);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Reset + prefill whenever the modal opens.
  useEffect(() => {
    if (!open) return undefined;
    setError('');
    setResult(null);
    setSubmitting(false);
    setEmail(getCredentials().email || '');
    setPhone('');

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    api
      .get('/payments/settings')
      .then((res) => {
        const list = res.data.data?.payment_methods || [];
        setMethods(list);
        setMomoNumber(res.data.data?.momo_number || '');
        setSubscriptionPrice(res.data.data?.subscription_price || 0);
        setMethod((prev) => (list.includes(prev) ? prev : list[0] || ''));
      })
      .catch(() => setError('Could not load payment options. Please try again.'));

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const amount = amountFor(type, item, subscriptionPrice);
  const itemTitle = type === 'subscription' ? 'Unlock the full music library' : item?.title || '';

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!method) return setError('Please choose a payment method.');
    if (method === 'mobile_money' && !phone.trim()) {
      return setError('Please enter your Mobile Money phone number.');
    }

    setSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        payment_method: method,
        payment_type: type,
      };
      if (method === 'mobile_money') payload.phone = phone.trim();
      if (item?.id) payload.item_id = item.id;

      const res = await api.post('/payments/checkout', payload);
      setCredentials(email.trim(), res.data.access_token);
      setResult(res.data);
      onSuccess?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be completed. Please try again.');
    } finally {
      setSubmitting(false);
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
          aria-label={result ? 'Payment successful' : 'Checkout'}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-white shadow-glow dark:bg-night-700"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {result ? 'Payment Successful' : TYPE_LABEL[type] || 'Checkout'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close checkout"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <FaXmark className="h-4 w-4" />
              </button>
            </div>

            {result ? (
              <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                  <FaCircleCheck className="h-8 w-8" />
                </span>
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {result.payment?.item_title || 'Access unlocked!'}
                </p>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Your purchase is complete. This device can now play all unlocked content — no account needed.
                </p>
                {result.payment?.amount > 0 && (
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Amount paid: <span className="text-gold">{formatMoney(result.payment.amount)}</span>
                  </p>
                )}
                {result.expires_at && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Valid until {new Date(result.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                <div className="w-full max-w-xs rounded-xl bg-slate-100 p-3 dark:bg-night-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Access Token</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-300">{result.access_token}</p>
                </div>
                <button type="button" onClick={onClose} className="btn-primary mt-2">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5 px-6 py-6">
                <div className="rounded-xl bg-slate-100 p-4 dark:bg-night-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{itemTitle}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {type === 'subscription' ? '30 days of full-access listening' : 'One-time payment'}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-bold text-gold">
                      {amount > 0 ? formatMoney(amount) : 'Free'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="checkout-email">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Used to verify access on this device. No account is created.
                  </p>
                </div>

                <div>
                  <label className="label">Payment method</label>
                  <div className="space-y-2">
                    {methods.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No payment methods are currently available.</p>
                    ) : (
                      methods.map((m) => {
                        const meta = METHODS.find((x) => x.key === m);
                        if (!meta) return null;
                        const Icon = meta.icon;
                        const active = method === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMethod(m)}
                            aria-pressed={active}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                              active
                                ? 'border-gold bg-gold/10'
                                : 'border-slate-300 hover:border-gold/50 dark:border-white/10 dark:hover:border-gold/50'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${active ? 'text-gold' : 'text-slate-400'}`} />
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{meta.label}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400">{meta.hint}</span>
                            </span>
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                active ? 'border-gold' : 'border-slate-300 dark:border-white/20'
                              }`}
                            >
                              {active && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {method === 'mobile_money' && (
                  <div>
                    <label className="label" htmlFor="checkout-phone">
                      Mobile Money phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input"
                      placeholder="e.g. +250 7xx xxx xxx"
                      autoComplete="tel"
                    />
                    {momoNumber && (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Send payment to <span className="font-semibold text-slate-600 dark:text-slate-300">{momoNumber}</span>
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">{error}</p>
                )}

                <button type="submit" disabled={submitting || methods.length === 0} className="btn-primary w-full">
                  <FiLock className="h-4 w-4" />
                  {submitting ? 'Processing…' : `Pay ${amount > 0 ? formatMoney(amount) : 'Free'}`}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  By completing this payment you agree to the site's terms. Payments are processed without creating an account.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
