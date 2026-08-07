import { useEffect, useState } from 'react';
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
} from 'react-icons/fa6';
import api from '../api/client.js';
import StatCard from './components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import { useToast } from './components/Toast.jsx';
import { formatMoney, formatNumber } from '../lib/format.js';

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

export default function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => show('Could not load dashboard statistics.', 'error'));
  }, [show]);

  useEffect(() => {
    api
      .get('/admin/metrics')
      .then((res) => setMetrics(res.data.data))
      .catch(() => show('Could not load payment metrics.', 'error'));
  }, [show]);

  if (!stats) return <Loader />;

  const cards = [
    { icon: FaMusic, label: 'Total Songs', value: stats.totalSongs, to: '/admin/songs' },
    { icon: FaVideo, label: 'Total Videos', value: stats.totalVideos, to: '/admin/videos' },
    { icon: FaCalendarDays, label: 'Total Events', value: stats.totalEvents, to: '/admin/events' },
    { icon: FaImages, label: 'Gallery Images', value: stats.totalGallery, to: '/admin/gallery' },
    { icon: FaNewspaper, label: 'News Articles', value: stats.totalNews, to: '/admin/news' },
    { icon: FaEnvelopeOpenText, label: 'Unread Messages', value: stats.unreadMessages, to: '/admin/messages' },
  ];

  if (metrics) {
    cards.push(
      { icon: FaSackDollar, label: 'Subscription Revenue', value: formatMoney(metrics.subscriptionRevenue), to: '/admin/settings' },
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
                {formatMoney(metrics.subscriptionRevenue)} total from subscriptions
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
              <table className="w-full min-w-[720px] text-left text-sm">
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
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{formatMoney(s.amount)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{timeAgo(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            s.status === 'active' ? 'bg-green-500/15 text-green-500' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                          }`}
                        >
                          {s.status}
                        </span>
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
