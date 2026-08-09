import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiUsers } from 'react-icons/fi';
import api from '../api/client.js';
import Loader from '../components/Loader.jsx';

const STATUS_STYLE = {
  active: 'bg-green-500/15 text-green-500',
  pending: 'bg-amber-500/15 text-amber-500',
  banned: 'bg-red-500/15 text-red-500',
  deleted: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400',
};

const STATUS_LABEL = {
  active: 'Active',
  pending: 'Pending',
  banned: 'Banned',
  deleted: 'Deleted',
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
  const label = STATUS_LABEL[status] || status;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
        STATUS_STYLE[status] || 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
      }`}
    >
      {label}
    </span>
  );
}

function initials(account) {
  const source = account.display_name || account.email || '?';
  const parts = source.split('@')[0].split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] || '?';
  const second = parts[1]?.[0] || '';
  return (first + second).toUpperCase();
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/accounts');
      setAccounts(res.data.data.accounts || []);
      setTotal(res.data.data.total ?? (res.data.data.accounts || []).length);
    } catch (err) {
      setAccounts([]);
      setError(err.response?.data?.message || 'Could not load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Accounts</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {total} registered account{total !== 1 ? 's' : ''} — created through the public signup.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAccounts}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-semibold text-night transition hover:brightness-110 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <FiUsers className="h-8 w-8 text-red-500" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{error}</p>
          <button
            type="button"
            onClick={fetchAccounts}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-semibold text-night transition hover:brightness-110"
          >
            <FiRefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <FiUsers className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">No accounts yet. New signups will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="px-6 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Last Sign In</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                          {initials(a)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                            {a.display_name || '—'}
                          </p>
                          <p className="truncate font-mono text-[11px] text-slate-400">{a.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-500 dark:text-slate-400">{a.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(a.created_at)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(a.last_sign_in_at)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
