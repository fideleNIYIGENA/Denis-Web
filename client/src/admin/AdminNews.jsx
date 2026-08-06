import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
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
  published_date: new Date().toISOString().slice(0, 10),
  category: 'News',
  author: 'Denis Ndayishimiye',
};

export default function AdminNews() {
  const { show } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/news', { params: { page, limit: 10, search } });
      setArticles(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title || '',
      description: a.description || '',
      published_date: a.published_date || '',
      category: a.category || 'News',
      author: a.author || 'Denis Ndayishimiye',
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return show('Article title is required.', 'error');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v ?? '')));
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await api.put(`/news/${editing.id}`, fd);
        show('Article updated successfully.');
      } else {
        await api.post('/news', fd);
        show('Article created successfully.');
      }
      setModalOpen(false);
      fetchNews();
    } catch (err) {
      show(err.response?.data?.message || 'Could not save the article.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/news/${deleting.id}`);
      show('Article deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchNews();
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the article.', 'error');
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
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Manage News</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{articles.length} articles on this page.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Write Article
        </button>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" aria-label="Search articles" className="input pl-11 pr-10" />
        {q && (
          <button type="button" onClick={() => { setQ(''); setSearch(''); setPage(1); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <Loader />
      ) : articles.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">{search ? 'No articles match your search.' : 'No articles yet.'}</div>
      ) : (
        <div className="card divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
          {articles.map((a) => (
            <div key={a.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {a.image_url && <img src={a.image_url} alt={a.title} className="aspect-video h-16 w-24 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {a.category} • {a.published_date || ''} • {a.author}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => openEdit(a)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-gold hover:text-night dark:bg-white/10 dark:text-slate-300" aria-label={`Edit ${a.title}`}>
                  <FiEdit className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setDeleting(a); setConfirmOpen(true); }} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-white/10" aria-label={`Delete ${a.title}`}>
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Article' : 'Write Article'} maxWidth="max-w-2xl">
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Title" required>
              <input name="title" value={form.title} onChange={setField} className="input" required />
            </FormField>
          </div>
          <FormField label="Published Date">
            <input name="published_date" type="date" value={form.published_date} onChange={setField} className="input" />
          </FormField>
          <FormField label="Category">
            <input name="category" value={form.category} onChange={setField} className="input" placeholder="e.g. News / Release / Ministry" />
          </FormField>
          <FormField label="Author">
            <input name="author" value={form.author} onChange={setField} className="input" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Cover Image" hint="JPG, PNG or WebP. Max 8 MB.">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Content" hint="Separate paragraphs with blank lines.">
              <textarea name="description" rows={8} value={form.description} onChange={setField} className="input resize-y" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Update Article' : 'Publish Article'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
