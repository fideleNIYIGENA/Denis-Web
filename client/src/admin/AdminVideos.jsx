import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa6';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import Modal from './components/Modal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import FormField from './components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';

const EMPTY = {
  title: '',
  description: '',
  youtube_url: '',
  duration: '',
  is_short: false,
  featured: false,
};

export default function AdminVideos() {
  const { show } = useToast();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [thumbFile, setThumbFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/videos', { params: { page, limit: 10, search } });
      setVideos(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setThumbFile(null);
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      title: v.title || '',
      description: v.description || '',
      youtube_url: v.youtube_url || '',
      duration: v.duration ? String(v.duration) : '',
      is_short: !!v.is_short,
      featured: !!v.featured,
    });
    setThumbFile(null);
    setModalOpen(true);
  };

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return show('Video title is required.', 'error');
    if (!editing && !form.youtube_url.trim()) return show('A YouTube link is required.', 'error');
    if (form.is_short && Number(form.duration) > 60) {
      return show('Short videos must be at most 60 seconds (1 minute).', 'error');
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v === true ? 'true' : v === false ? 'false' : String(v ?? '')));
      if (thumbFile) fd.append('thumbnail', thumbFile);

      if (editing) {
        await api.put(`/videos/${editing.id}`, fd);
        show('Video updated successfully.');
      } else {
        await api.post('/videos', fd);
        show('Video created successfully.');
      }
      setModalOpen(false);
      fetchVideos();
    } catch (err) {
      show(err.response?.data?.message || 'Could not save the video.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/videos/${deleting.id}`);
      show('Video deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchVideos();
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the video.', 'error');
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Manage Videos</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{videos.length} videos on this page.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Add Video
        </button>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos…" aria-label="Search videos" className="input pl-11 pr-10" />
        {q && (
          <button type="button" onClick={() => { setQ(''); setSearch(''); setPage(1); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <Loader />
      ) : videos.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">{search ? 'No videos match your search.' : 'No videos yet.'}</div>
      ) : (
        <div className="card divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
          {videos.map((v) => (
            <div key={v.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {v.thumbnail_url && <img src={v.thumbnail_url} alt={v.title} className="aspect-video h-16 w-24 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{v.title}</p>
                    {v.featured && (
                      <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                        <FaStar className="h-2.5 w-2.5" /> Featured
                      </span>
                    )}
                    {v.is_short && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">Short</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{v.youtube_url}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => openEdit(v)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-gold hover:text-night dark:bg-white/10 dark:text-slate-300" aria-label={`Edit ${v.title}`}>
                  <FiEdit className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setDeleting(v); setConfirmOpen(true); }} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-white/10" aria-label={`Delete ${v.title}`}>
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Video' : 'Add Video'} maxWidth="max-w-2xl">
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Video Title" required>
              <input name="title" value={form.title} onChange={setField} className="input" required />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="YouTube Link" required={!editing} hint="e.g. https://youtu.be/abc123 or https://www.youtube.com/watch?v=abc123">
              <input name="youtube_url" value={form.youtube_url} onChange={setField} className="input" placeholder="https://youtube.com/…" />
            </FormField>
          </div>
          <FormField label="Duration (seconds)">
            <input name="duration" type="number" min="1" value={form.duration} onChange={setField} className="input" placeholder="e.g. 300" />
          </FormField>
          <FormField label="Thumbnail" hint="Optional. If empty, the YouTube thumbnail is used.">
            <input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] || null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
          </FormField>
          <FormField label="Short Video (Shorts)">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 dark:border-white/10">
              <input name="is_short" type="checkbox" checked={form.is_short} onChange={(e) => setForm((f) => ({ ...f, is_short: e.target.checked }))} className="h-4 w-4 accent-gold" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Shorts are limited to 1 minute</span>
            </label>
          </FormField>
          <FormField label="Featured Video">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 dark:border-white/10">
              <input name="featured" type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 accent-gold" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Show on the home page</span>
            </label>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description">
              <textarea name="description" rows={3} value={form.description} onChange={setField} className="input resize-y" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Update Video' : 'Add Video'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Video"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
