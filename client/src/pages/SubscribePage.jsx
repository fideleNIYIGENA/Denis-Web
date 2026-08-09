import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaCrown, FaCircleCheck, FaClockRotateLeft, FaCircleXmark, FaRightToBracket, FaUserPlus } from 'react-icons/fa6';
import PageHeader from '../components/PageHeader.jsx';
import CheckoutModal from '../components/CheckoutModal.jsx';
import api from '../api/client.js';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { formatPrice } from '../lib/format.js';
import useSEO from '../hooks/useSEO.js';

export default function SubscribePage() {
  useSEO({ title: 'Subscribe', description: 'Subscribe to unlock interactive features.' });
  const { isAuthenticated, loading, profile, subscription, refreshProfile } = useUserAuth();
  const { currency, setCurrency } = useCurrency();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [subRwf, setSubRwf] = useState(5000);
  const [subUsd, setSubUsd] = useState(5);

  useEffect(() => {
    api
      .get('/payments/settings')
      .then((res) => {
        const d = res.data.data || {};
        setSubRwf(Number(d.subscription_price_rwf) || 5000);
        setSubUsd(Number(d.subscription_price_usd) || 5);
      })
      .catch(() => {});
  }, []);

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <>
        <PageHeader
          eyebrow="Membership"
          title="Subscribe"
          subtitle="Unlock likes, comments and subscriber-only interactions."
          breadcrumb={[{ label: 'Subscribe', to: '/subscribe' }]}
        />
        <section className="py-16">
          <div className="container-x mx-auto max-w-xl text-center">
            <div className="card p-10">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
                <FaCrown className="h-8 w-8" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-slate-900 dark:text-white">Login or Create Account</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You need an account before you can subscribe and interact with songs and videos.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/login" className="btn-primary">
                  <FaRightToBracket className="h-4 w-4" /> Log In
                </Link>
                <Link to="/register" className="btn-outline border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                  <FaUserPlus className="h-4 w-4" /> Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const active = subscription.status === 'active';

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Subscribe"
        subtitle="One subscription unlocks likes, dislikes and comments across all songs and videos."
        breadcrumb={[{ label: 'Subscribe', to: '/subscribe' }]}
      />

      <section className="py-14">
        <div className="container-x">
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
            {/* Current status */}
            <div className="card p-8">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Your Subscription</h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Account</span>
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{profile?.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                      active
                        ? 'bg-royal/15 text-royal-500'
                        : subscription.status === 'pending'
                          ? 'bg-gold/15 text-gold'
                          : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    {active ? <FaCircleCheck className="h-3 w-3" /> : <FaClockRotateLeft className="h-3 w-3" />}
                    {active ? 'Active' : subscription.status === 'pending' ? 'Pending Approval' : subscription.status}
                  </span>
                </div>
                {subscription.expires_at && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Expires</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {active ? (
                  <p className="rounded-xl bg-royal/10 px-4 py-3 text-sm font-medium text-royal-500">
                    You're subscribed! You can like and comment on songs and videos.
                  </p>
                ) : subscription.status === 'pending' ? (
                  <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm font-medium text-gold">
                    Your payment is awaiting admin approval. You'll be unlocked as soon as it's confirmed.
                  </p>
                ) : (
                  <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                    <FaCircleXmark className="mt-0.5 h-4 w-4 shrink-0" />
                    Subscribing is required before you can like, dislike or comment.
                  </p>
                )}
              </div>

              <Link to="/account" className="mt-6 inline-flex text-sm font-semibold text-gold transition hover:brightness-125">
                Back to My Account →
              </Link>
            </div>

            {/* Pricing + checkout */}
            <div className="card relative overflow-hidden p-8">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage: 'radial-gradient(circle at 85% 10%, rgba(255,162,1,0.18), transparent 55%)',
                }}
                aria-hidden
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold">
                  <FaCrown className="h-3 w-3" /> Full Access
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {active ? 'Extend your subscription' : 'Become a subscriber'}
                </h2>

                <div className="mt-4 flex items-center rounded-full bg-slate-100 p-0.5 dark:bg-white/10">
                  {['RWF', 'USD'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      aria-pressed={currency === c}
                      className={`flex-1 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                        currency === c ? 'bg-gold-gradient text-night shadow' : 'text-slate-500 hover:text-gold dark:text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {formatPrice(currency === 'USD' ? subUsd : subRwf, currency)} for 30 days of full access.
                </p>

                <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {['Like & dislike every song and video', 'Comment on your favourite tracks', 'Support the ministry'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <FaCircleCheck className="h-4 w-4 shrink-0 text-royal-500" /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="btn-primary mt-8 w-full"
                  disabled={active}
                >
                  <FaCrown className="h-4 w-4" />
                  {active ? 'Already Subscribed' : `Subscribe — ${formatPrice(currency === 'USD' ? subUsd : subRwf, currency)}`}
                </button>

                <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Payment starts as pending and is unlocked after the admin confirms receipt. {active && 'Use checkout to extend when your subscription expires.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        type="subscription"
        lockedEmail={profile?.email || ''}
        onSuccess={refreshProfile}
      />
    </>
  );
}
