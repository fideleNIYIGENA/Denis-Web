import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMusic,
  FaVideo,
  FaImages,
  FaCalendarDays,
  FaEnvelopeOpenText,
  FaPlus,
  FaNewspaper,
  FaSackDollar,
  FaHeadphones,
  FaUsersLine,
  FaCheck,
  FaXmark,
  FaClockRotateLeft,
} from 'react-icons/fa6';
import api from '../api/client.js';
import StatCard from './components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import { useToast } from './components/Toast.jsx';
import { formatMoney, formatNumber, formatPrice } from '../lib/format.js';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const METHOD_LABEL = {
  mobile_money: 'Mobile Money',
  card: 'Card',
};

const TYPE_LABEL = {
  subscription: 'Subscription',
  track_buy: 'Track',
  event_ticket: 'Event',
};

const SUB_STATUS_STYLE = {
  active: 'bg-green-500/15 text-green-500',
  expired: 'bg-amber-500/15 text-amber-500',
  pending: 'bg-gold/15 text-gold',
  rejected: 'bg-red-500/15 text-red-500',
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
        SUB_STATUS_STYLE[status] || 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const loadMetrics = useCallback(() => {
    api
      .get('/admin/metrics')
      .then((res) => setMetrics(res.data.data))
      .catch(() => show('Could not load payment metrics.', 'error'));
  }, [show]);

  const loadPending = useCallback(() => {
    setPendingLoading(true);
    api
      .get('/admin/payments/pending')
      .then((res) => setPending(res.data.data || []))
      .catch(() => show('Could not load pending payments.', 'error'))
      .finally(() => setPendingLoading(false));
  }, [show]);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => show('Could not load dashboard statistics.', 'error'));
  }, [show]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const actOnPayment = async (payment, action) => {
    setActingId(payment.id);
    try {
      await api.put(`/admin/payments/${payment.id}/${action}`);
      show(
        action === 'approve'
          ? `Payment approved — ${payment.payer_email} is now unlocked.`
          : `Payment from ${payment.payer_email} rejected.`
      );
      loadPending();
      loadMetrics();
    } catch (err) {
      show(err.response?.data?.message || `Could not ${action} the payment.`, 'error');
    } finally {
      setActingId(null);
    }
  };

  if (!stats) return <Loader />;

  const cards = [
    { icon: FaUsersLine, label: 'Total Accounts', value: stats.totalAccounts, to: '/admin/accounts' },
    { icon: FaMusic, label: 'Total Songs', value: stats.totalSongs, to: '/admin/songs' },
    { icon: FaVideo, label: 'Total Videos', value: stats.totalVideos, to: '/admin/videos' },
    { icon: FaCalendarDays, label: 'Total Events', value: stats.totalEvents, to: '/admin/events' },
    { icon: FaImages, label: 'Gallery Images', value: stats.totalGallery, to: '/admin/gallery' },
    { icon: FaNewspaper, label: 'News Articles', value: stats.totalNews, to: '/admin/news' },
    { icon: FaEnvelopeOpenText, label: 'Unread Messages', value: stats.unreadMessages, to: '/admin/messages' },
  ];

  if (metrics) {
    cards.push(
      { icon: FaSackDollar, label: 'Total RWF Revenue', value: formatPrice(metrics.revenueRwf, 'RWF'), to: '/admin/settings' },
      { icon: FaSackDollar, label: 'Total USD Revenue', value: formatPrice(metrics.revenueUsd, 'USD'), to: '/admin/settings' },
      { icon: FaHeadphones, label: 'Total Plays & Views', value: formatNumber(metrics.totalPlaysViews), to: '/admin' }
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Everything happening across the website at a glance.</p>
        </div>
        <Link to="/admin/songs" className="btn-primary">
          <FaPlus className="h-4 w-4" /> Add New Song
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <Link key={c.label} to={c.to} className="transition hover:opacity-90">
            <StatCard icon={c.icon} label={c.label} value={c.value} index={i} />
          </Link>
        ))}
      </div>

      {/* Pending payments */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
              <FaClockRotateLeft className="h-4 w-4 text-gold" /> Pending Payments
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Manually verify receipt of funds, then approve to unlock the buyer's email.
            </p>
          </div>
          {pending.length > 0 && (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold">{pending.length} awaiting</span>
          )}
        </div>

        {pendingLoading ? (
          <Loader />
        ) : pending.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No pending payments. New checkouts will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Currency</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td className="max-w-[220px] truncate px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {p.payer_email}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.payer_phone || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{formatPrice(p.amount, p.currency)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.currency}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{TYPE_LABEL[p.type] || p.type}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{timeAgo(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={actingId === p.id}
                          onClick={() => actOnPayment(p, 'approve')}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-green-500/15 px-3 text-xs font-bold text-green-500 transition hover:bg-green-500 hover:text-white disabled:opacity-50"
                        >
                          <FaCheck className="h-3 w-3" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={actingId === p.id}
                          onClick={() => actOnPayment(p, 'reject')}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          <FaXmark className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent messages */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Recent Messages</h3>
          <Link to="/admin/messages" className="text-sm font-semibold text-gold transition hover:underline">
            View all
          </Link>
        </div>

        {stats.recentMessages.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {stats.recentMessages.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!m.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />}
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{m.name}</p>
                    <span className="text-xs text-slate-400">· {timeAgo(m.created_at)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{m.subject}</p>
                </div>
                <Link
                  to="/admin/messages"
                  className="shrink-0 text-xs font-semibold text-gold transition hover:underline"
                >
                  Open message
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Subscribers */}
      {metrics && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Subscribers</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {metrics.subscribers.length} subscription purchase{metrics.subscribers.length !== 1 ? 's' : ''} •{' '}
                {formatMoney(metrics.revenueRwf)} / {formatPrice(metrics.revenueUsd, 'USD')} from completed subscriptions
              </p>
            </div>
            <Link to="/admin/settings" className="text-sm font-semibold text-gold transition hover:underline">
              Payment settings
            </Link>
          </div>

          {metrics.subscribers.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No subscriptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {metrics.subscribers.map((s) => (
                    <tr key={s.id}>
                      <td className="max-w-[220px] truncate px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {s.payer_email}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.payer_phone || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {METHOD_LABEL[s.payment_method] || s.payment_method}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {formatPrice(s.amount, s.currency)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{timeAgo(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
