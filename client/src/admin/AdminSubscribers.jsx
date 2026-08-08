import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import Loader from '../components/Loader.jsx';
import { formatPrice } from '../lib/format.js';

const SUB_STATUS_STYLE = {
  active: 'bg-green-500/15 text-green-500',
  expired: 'bg-amber-500/15 text-amber-500',
  pending: 'bg-gold/15 text-gold',
  rejected: 'bg-red-500/15 text-red-500',
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

export default function AdminSubscribers() {
  const { show } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubscribers = useCallback(
    async (term) => {
      setLoading(true);
      try {
        const params = {};
        if (term) params.search = term;
        const res = await api.get('/admin/subscribers', { params });
        setSubscribers(res.data.data || []);
        setTotal(res.data.total ?? (res.data.data || []).length);
      } catch {
        setSubscribers([]);
        show('Could not load subscribers.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [show]
  );

  // Debounce the search box → API request.
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    fetchSubscribers(search);
  }, [search, fetchSubscribers]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeletingId(deleting.id);
    try {
      const query = deleting.source === 'newsletter' ? '?source=newsletter' : '';
      await api.delete(`/admin/subscribers/${deleting.id}${query}`);
      show('Subscriber deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchSubscribers(search);
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the subscriber.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Subscribers</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {total} subscriber{total !== 1 ? 's' : ''} — newsletter signups and paid subscriptions.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or phone…"
          aria-label="Search subscribers by email or phone"
          className="input pl-11 pr-10"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setSearch('');
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : subscribers.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          {search ? `No subscribers match "${search}".` : 'No subscribers yet.'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {subscribers.map((s) => (
                  <tr key={`${s.source}-${s.id}`}>
                    <td className="max-w-[240px] truncate px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          s.source === 'subscription'
                            ? 'bg-royal/15 text-royal-500'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                        }`}
                      >
                        {s.source === 'subscription' ? 'Subscription' : 'Newsletter'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {s.amount !== null && s.amount !== undefined ? (
                        <>
                          {formatPrice(s.amount, s.currency)}
                          <span className="ml-1 text-[11px] font-medium text-slate-400">{s.currency}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          disabled={deletingId === s.id}
                          onClick={() => {
                            setDeleting(s);
                            setConfirmOpen(true);
                          }}
                          aria-label={`Delete subscriber ${s.email}`}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          <FiTrash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        confirming={deletingId === deleting?.id}
        title="Delete Subscriber"
        message={`Are you sure you want to remove "${deleting?.email}"? This cannot be undone.`}
      />
    </div>
  );
}
