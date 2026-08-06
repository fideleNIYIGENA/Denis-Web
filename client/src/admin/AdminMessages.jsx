import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiTrash2, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { FaEnvelopeOpen } from 'react-icons/fa6';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import Modal from './components/Modal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminMessages() {
  const { show } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search };
      if (unreadOnly) params.unread = 'true';
      const res = await api.get('/messages', { params });
      setMessages(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, unreadOnly]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const openMessage = async (m) => {
    setViewing(m);
    if (!m.is_read) {
      try {
        await api.patch(`/messages/${m.id}/read`, { is_read: true });
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)));
      } catch {
        // ignore — the message still opens
      }
    }
  };

  const toggleRead = async (m) => {
    try {
      await api.patch(`/messages/${m.id}/read`, { is_read: !m.is_read });
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: !m.is_read } : x)));
      if (viewing?.id === m.id) setViewing((v) => (v ? { ...v, is_read: !m.is_read } : v));
    } catch {
      show('Could not update the message.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/messages/${deleting.id}`);
      show('Message deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchMessages();
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the message.', 'error');
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Messages</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount} unread on this page` : 'All messages read'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setUnreadOnly((u) => !u); setPage(1); }}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${unreadOnly ? 'bg-gold-gradient text-night' : 'bg-slate-100 text-slate-600 hover:text-gold dark:bg-white/10 dark:text-slate-300'}`}
        >
          Unread only
        </button>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" aria-label="Search messages" className="input pl-11 pr-10" />
        {q && (
          <button type="button" onClick={() => { setQ(''); setSearch(''); setPage(1); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <Loader />
      ) : messages.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">No messages yet.</div>
      ) : (
        <div className="card divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
          {messages.map((m) => (
            <button key={m.id} type="button" onClick={() => openMessage(m)} className="flex w-full flex-col gap-2 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {!m.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />}
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{m.name}</p>
                  <span className="text-xs text-slate-400">· {m.email}</span>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatDate(m.created_at)}</span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{m.subject}</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{m.message}</p>
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* View modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Message Details" maxWidth="max-w-2xl">
        {viewing && (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-100 p-5 dark:bg-night-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{viewing.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{viewing.email}</p>
                  {viewing.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{viewing.phone}</p>}
                </div>
                <p className="text-xs text-slate-400">{formatDate(viewing.created_at)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Subject</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{viewing.subject}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Message</p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">{viewing.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
              <button type="button" onClick={() => toggleRead(viewing)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                {viewing.is_read ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                {viewing.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <a href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(viewing.subject)}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                <FaEnvelopeOpen className="h-4 w-4" /> Reply by Email
              </a>
              <button type="button" onClick={() => { setDeleting(viewing); setConfirmOpen(true); }} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
                <FiTrash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Message"
        message={`Delete the message from "${deleting?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
