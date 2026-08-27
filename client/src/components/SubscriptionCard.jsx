import {
  FaCrown,
  FaCircleCheck,
  FaClockRotateLeft,
  FaCircleXmark,
  FaCalendarDays,
  FaHourglassHalf,
  FaRotateRight,
} from 'react-icons/fa6';
import { formatPrice } from '../lib/format.js';

const PLAN_LABEL = 'Premium';

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Reusable subscription status card.
 *
 * Renders the real subscription state (fetched from the backend, never from
 * frontend-only state) with clear, professional messaging for every case:
 *   - active   → "✓ Already Subscribed" + plan/started/expires/days/amount. No Subscribe button.
 *   - expired  → "Subscription Expired" + expiry date + Renew button.
 *   - pending  → awaiting admin approval.
 *   - inactive / cancelled → normal Subscribe prompt.
 *
 * `onRenew` is fired when the user chooses to (re)subscribe — callers wire this
 * to their own checkout flow (open the modal or navigate to /subscribe).
 */
export default function SubscriptionCard({ subscription, loading = false, error = '', onRenew }) {
  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <FaHourglassHalf className="h-4 w-4 animate-pulse text-gold" />
          <span>Checking your subscription status…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8">
        <div className="flex items-start gap-3 text-sm text-red-500">
          <FaCircleXmark className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Could not load your subscription.</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              We couldn't verify your subscription right now. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const status = subscription?.status || 'inactive';

  const isActive = status === 'active';
  const isExpired = status === 'expired';
  const isPending = status === 'pending';
  const isInactive = status === 'inactive' || status === 'cancelled';

  const days = isActive ? daysRemaining(subscription.expires_at) : null;
  const amount = Number(subscription.amount) || 0;
  const currency = subscription.currency || 'RWF';

  const statusTone = isActive
    ? 'bg-royal/15 text-royal-500'
    : isExpired
      ? 'bg-amber-500/15 text-amber-500'
      : isPending
        ? 'bg-gold/15 text-gold'
        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400';

  const StatusIcon = isActive ? FaCircleCheck : isPending ? FaClockRotateLeft : FaCircleXmark;
  const statusLabel = isActive
    ? 'Active'
    : isExpired
      ? 'Expired'
      : isPending
        ? 'Pending Approval'
        : status === 'cancelled'
          ? 'Cancelled'
          : 'Not Subscribed';

  const heroTitle = isActive
    ? 'Already Subscribed'
    : isExpired
      ? 'Subscription Expired'
      : isPending
        ? 'Awaiting Approval'
        : 'Not Subscribed Yet';

  const heroTone = isActive ? 'text-royal-500' : isExpired ? 'text-amber-500' : isPending ? 'text-gold' : 'text-slate-900 dark:text-white';

  return (
    <div className="card p-8">
      {/* Hero status */}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-royal/15 text-royal-500' : isExpired ? 'bg-amber-500/15 text-amber-500' : isPending ? 'bg-gold/15 text-gold' : 'bg-slate-100 text-slate-400 dark:bg-white/10'}`}
        >
          <FaCrown className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className={`flex items-center gap-2 font-display text-xl font-bold ${heroTone}`}>
            {isActive && <FaCircleCheck className="h-5 w-5 shrink-0" />}
            {heroTitle}
          </h2>
          <span
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${statusTone}`}
          >
            <StatusIcon className="h-3 w-3" /> {statusLabel}
          </span>
        </div>
      </div>

      {isActive && (
        <>
          {/* Active subscription details */}
          {days !== null && days <= 7 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold">
              <FaHourglassHalf className="h-4 w-4 shrink-0" />
              Your subscription ends in {days} day{days !== 1 ? 's' : ''}.
            </p>
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Plan</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <FaCrown className="h-3.5 w-3.5 text-gold" /> {PLAN_LABEL}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="font-semibold text-royal-500">Active</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Started</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(subscription.started_at)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Expires</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(subscription.expires_at)}</dd>
            </div>
            {days !== null && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Days remaining</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{days}</dd>
              </div>
            )}
            {amount > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Paid</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatPrice(amount, currency)}
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-6 rounded-xl bg-royal/10 px-4 py-3 text-sm font-medium text-royal-500">
            Your subscription is active — you can like and comment on songs and videos.
          </p>
        </>
      )}

      {isExpired && (
        <div className="mt-6">
          <dl className="space-y-3 text-sm">
            {subscription.expires_at && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Expired on</dt>
                <dd className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <FaCalendarDays className="h-3.5 w-3.5 text-amber-500" /> {formatDate(subscription.expires_at)}
                </dd>
              </div>
            )}
            {amount > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Last paid</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{formatPrice(amount, currency)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-500">
            Your previous subscription has ended. Renew to keep enjoying subscriber benefits.
          </p>
          <button type="button" onClick={onRenew} className="btn-primary mt-5 w-full">
            <FaRotateRight className="h-4 w-4" /> Renew Subscription
          </button>
        </div>
      )}

      {isPending && (
        <p className="mt-6 rounded-xl bg-gold/10 px-4 py-3 text-sm font-medium text-gold">
          Your payment is awaiting admin approval. You'll be unlocked as soon as it's confirmed.
        </p>
      )}

      {isInactive && (
        <>
          <p className="mt-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Subscribe to unlock likes, comments and subscriber-only interactions across all songs and videos.
          </p>
          <button type="button" onClick={onRenew} className="btn-primary mt-5 w-full">
            <FaCrown className="h-4 w-4" /> Subscribe
          </button>
        </>
      )}
    </div>
  );
}
