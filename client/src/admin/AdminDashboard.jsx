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
} from 'react-icons/fa6';
import api from '../api/client.js';
import StatCard from './components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import { useToast } from './components/Toast.jsx';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => show('Could not load dashboard statistics.', 'error'));
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
    </div>
  );
}
