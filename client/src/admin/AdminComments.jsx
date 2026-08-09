import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { FaMusic, FaVideo } from 'react-icons/fa6';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import Loader from '../components/Loader.jsx';

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const TYPE_META = {
  song: { label: 'Song', icon: FaMusic },
  video: { label: 'Video', icon: FaVideo },
};

export default function AdminComments() {
  const { show } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/comments', { params });
      setComments(res.data.data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const requestDelete = (c) => {
    setDeleting(c);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/comments/${deleting.id}`);
      setComments((prev) => prev.filter((c) => c.id !== deleting.id));
      show('Comment deleted.');
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete comment.', 'error');
    } finally {
      setConfirmOpen(false);
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Comments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">All public reactions on songs and videos</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1 sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search comments…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-royal focus:ring-2 focus:ring-royal/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQ('');
                  setSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-gold"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Loader />
      ) : comments.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500 dark:text-slate-400">No comments found.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="px-5 py-3 font-semibold">Author</th>
                  <th className="px-5 py-3 font-semibold">On</th>
                  <th className="px-5 py-3 font-semibold">Comment</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {comments.map((c) => {
                  const meta = TYPE_META[c.content_type] || { label: c.content_type, icon: FaMusic };
                  const Icon = meta.icon;
                  return (
                    <tr key={c.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {c.author_display_name || c.author_email?.split('@')[0] || 'Member'}
                        </div>
                        <div className="text-xs text-slate-400">{c.author_email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-royal/10 px-2.5 py-1 text-xs font-semibold text-royal-300">
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <p className="whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">{c.comment}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => requestDelete(c)}
                          aria-label="Delete comment"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete comment?"
        message="This permanently removes the comment. This action cannot be undone."
      />
    </div>
  );
}
