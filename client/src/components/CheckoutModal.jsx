import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMobileScreenButton, FaCreditCard, FaXmark, FaClockRotateLeft, FaCircleDollarToSlot } from 'react-icons/fa6';
import { FiLock } from 'react-icons/fi';
import api from '../api/client.js';
import { supabase } from '../lib/supabase.js';
import { getPayerEmail, setPayerEmail } from '../lib/purchases.js';
import { formatPrice } from '../lib/format.js';
import { useCurrency } from '../contexts/CurrencyContext.jsx';

const METHODS = [
  { key: 'mobile_money', label: 'Mobile Money', icon: FaMobileScreenButton, hint: 'MTN Mobile Money / Airtel Money' },
  { key: 'card', label: 'Card', icon: FaCreditCard, hint: 'Debit / credit card (USD)' },
];

const TYPE_LABEL = {
  subscription: 'Full Access Subscription',
  track_buy: 'Buy Track',
  event_ticket: 'Event Ticket',
};

function amountsFor(type, item, subRwf, subUsd) {
  if (type === 'subscription') return { rwf: subRwf, usd: subUsd };
  if (type === 'track_buy') {
    return { rwf: Number(item?.price_rwf) || 0, usd: Number(item?.price_usd) || 0 };
  }
  if (type === 'event_ticket') {
    return { rwf: Number(item?.ticket_price_rwf) || 0, usd: Number(item?.ticket_price_usd) || 0 };
  }
  return { rwf: 0, usd: 0 };
}

/**
 * Checkout modal — submits a PENDING payment for admin approval.
 *
 * - Works as a guest checkout with no account (existing behaviour).
 * - When `lockedEmail` is provided (a signed-in public user), the email field
 *   is locked to the account email and the request carries the Supabase token
 *   so the backend links the payment to the user.
 *
 * The visitor chooses RWF (local Mobile Money) or USD (card / international
 * transfer), enters their email + phone, and submits. Every purchase starts as
 * PENDING and only unlocks once the admin verifies receipt of funds and
 * approves it in the Admin Dashboard.
 */
export default function CheckoutModal({ open, onClose, type = 'subscription', item = null, onSuccess, lockedEmail = '' }) {
  const { currency, setCurrency } = useCurrency();

  const [methods, setMethods] = useState([]);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoMerchantCode, setMomoMerchantCode] = useState('');
  const [subRwf, setSubRwf] = useState(0);
  const [subUsd, setSubUsd] = useState(0);

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
    setEmail(lockedEmail || getPayerEmail() || '');
    setPhone('');

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    api
      .get('/payments/settings')
      .then((res) => {
        const d = res.data.data || {};
        const list = d.payment_methods || [];
        setMethods(list);
        setMomoNumber(d.momo_number || '');
        setMomoMerchantCode(d.momo_merchant_code || '');
        setSubRwf(Number(d.subscription_price_rwf) || 0);
        setSubUsd(Number(d.subscription_price_usd) || 0);
        setMethod((prev) => {
          if (list.includes(prev)) return prev;
          const preferred = currency === 'USD' ? 'card' : 'mobile_money';
          return list.includes(preferred) ? preferred : list[0] || '';
        });
      })
      .catch(() => setError('Could not load payment options. Please try again.'));

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const amounts = amountsFor(type, item, subRwf, subUsd);
  const amount = currency === 'USD' ? amounts.usd : amounts.rwf;
  const itemTitle = type === 'subscription' ? 'Unlock the full music library' : item?.title || '';

  // RWF → Mobile Money, USD → Card. Keep the pair in sync so the payment
  // instructions always match the selected currency.
  const changeCurrency = (c) => {
    setCurrency(c);
    const preferred = c === 'RWF' ? 'mobile_money' : 'card';
    if (methods.includes(preferred)) setMethod(preferred);
  };

  const changeMethod = (m) => {
    setMethod(m);
    setCurrency(m === 'card' ? 'USD' : 'RWF');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (amount <= 0) {
      return setError(
        currency === 'USD'
          ? 'This item has no USD price yet — please choose RWF.'
          : 'This item has no RWF price yet — please choose USD.'
      );
    }
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
        currency,
      };
      if (method === 'mobile_money') payload.phone = phone.trim();
      if (item?.id) payload.item_id = item.id;

      // A signed-in public user's token lets the backend link this payment to
      // their account (the backend still uses the verified email, never ours).
      let headers;
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.access_token) {
          headers = { Authorization: `Bearer ${sessionData.session.access_token}` };
        }
      }

      const res = await api.post('/payments/checkout', payload, { headers });
      setPayerEmail(email.trim());
      setResult(res.data);
      onSuccess?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment could not be submitted. Please try again.');
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
          aria-label={result ? 'Payment submitted' : 'Checkout'}
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
                {result ? 'Payment Submitted' : TYPE_LABEL[type] || 'Checkout'}
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
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <FaClockRotateLeft className="h-8 w-8" />
                </span>
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">Payment Submitted!</p>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Your access is pending admin verification. Once the admin confirms receipt of your payment, your email
                  will be unlocked.
                </p>
                {result.payment?.amount > 0 && (
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Amount due:{' '}
                    <span className="text-gold">{formatPrice(result.payment.amount, result.payment.currency)}</span>
                  </p>
                )}
                {result.payment?.id && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">Reference: {result.payment.id.slice(0, 8).toUpperCase()}</p>
                )}
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
                    <p className="shrink-0 font-display text-lg font-bold text-gold">{formatPrice(amount, currency)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    ≈ {formatPrice(currency === 'USD' ? amounts.rwf : amounts.usd, currency === 'USD' ? 'RWF' : 'USD')}
                  </p>
                </div>

                {/* Currency toggle */}
                <div>
                  <span className="label">Pay in</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'RWF', label: 'RWF', hint: 'Mobile Money' },
                      { key: 'USD', label: 'USD', hint: 'Card / Transfer' },
                    ].map((c) => {
                      const active = currency === c.key;
                      const preferred = c.key === 'RWF' ? 'mobile_money' : 'card';
                      const disabled = (c.key === 'USD' ? amounts.usd : amounts.rwf) <= 0 || !methods.includes(preferred);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => changeCurrency(c.key)}
                          aria-pressed={active}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            active
                              ? 'border-gold bg-gold/10'
                              : 'border-slate-300 hover:border-gold/50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:border-gold/50'
                          }`}
                        >
                          <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{c.label}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{c.hint}</span>
                        </button>
                      );
                    })}
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
                    readOnly={Boolean(lockedEmail)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {lockedEmail ? (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Using your account email — approval unlocks your subscription automatically.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Your email is used to verify access once your payment is approved. No account is created.
                    </p>
                  )}
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
                            onClick={() => changeMethod(m)}
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

                {method === 'mobile_money' && currency === 'RWF' && (
                  <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <FaCircleDollarToSlot className="h-4 w-4 text-gold" /> How to pay (RWF)
                    </p>
                    <ol className="mt-2 space-y-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      <li>1. Send <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPrice(amount, 'RWF')}</span> via Mobile Money to:</li>
                      <li className="pl-4">• MoMo number: <span className="font-semibold text-slate-700 dark:text-slate-300">{momoNumber || '—'}</span></li>
                      {momoMerchantCode && (
                        <li className="pl-4">• Merchant code: <span className="font-semibold text-slate-700 dark:text-slate-300">{momoMerchantCode}</span></li>
                      )}
                      <li>2. Then submit this form with the same phone number.</li>
                      <li>3. The admin verifies receipt and unlocks your email.</li>
                    </ol>
                  </div>
                )}

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
                  </div>
                )}

                {method === 'card' && currency === 'USD' && (
                  <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Pay <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPrice(amount, 'USD')}</span> via
                      international card / bank transfer, then submit this form. The admin verifies receipt and unlocks
                      your email. Our card details are shared after you submit.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">{error}</p>
                )}

                <button type="submit" disabled={submitting || methods.length === 0} className="btn-primary w-full">
                  <FiLock className="h-4 w-4" />
                  {submitting ? 'Submitting…' : `Submit ${formatPrice(amount, currency)}`}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Access unlocks after the admin approves your payment. No account or login required.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
