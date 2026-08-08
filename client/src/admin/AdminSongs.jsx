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
import { formatPrice } from '../lib/format.js';

const EMPTY = {
  title: '',
  genre: 'Gospel',
  description: '',
  release_date: '',
  featured: false,
  price_rwf: '',
  price_usd: '',
  is_free: true,
  spotify_url: '',
  apple_music_url: '',
  boomplay_url: '',
  audiomack_url: '',
  youtube_url: '',
  download_url: '',
};

const LINK_FIELDS = [
  ['spotify_url', 'Spotify URL'],
  ['apple_music_url', 'Apple Music URL'],
  ['boomplay_url', 'Boomplay URL'],
  ['audiomack_url', 'Audiomack URL'],
  ['youtube_url', 'YouTube URL'],
  ['download_url', 'Download URL'],
];

export default function AdminSongs() {
  const { show } = useToast();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [coverFile, setCoverFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/songs', { params: { page, limit: 10, search } });
      setSongs(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setCoverFile(null);
    setAudioFile(null);
    setModalOpen(true);
  };

  const openEdit = (song) => {
    setEditing(song);
    setForm({
      title: song.title || '',
      genre: song.genre || 'Gospel',
      description: song.description || '',
      release_date: song.release_date?.slice(0, 10) || '',
      featured: !!song.featured,
      price_rwf: song.price_rwf ?? '',
      price_usd: song.price_usd ?? '',
      is_free: song.is_free !== false,
      spotify_url: song.spotify_url || '',
      apple_music_url: song.apple_music_url || '',
      boomplay_url: song.boomplay_url || '',
      audiomack_url: song.audiomack_url || '',
      youtube_url: song.youtube_url || '',
      download_url: song.download_url || '',
    });
    setCoverFile(null);
    setAudioFile(null);
    setModalOpen(true);
  };

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return show('Song title is required.', 'error');
    if (!editing && !audioFile) return show('Please select an audio file.', 'error');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'price_rwf' || k === 'price_usd' || k === 'is_free') return; // saved via the pricing endpoint
        fd.append(k, v === true ? 'true' : v === false ? 'false' : String(v ?? ''));
      });
      if (coverFile) fd.append('cover', coverFile);
      if (audioFile) fd.append('audio', audioFile);

      let songId = editing?.id;
      if (editing) {
        await api.put(`/songs/${editing.id}`, fd);
        show('Song updated successfully.');
      } else {
        const res = await api.post('/songs', fd);
        songId = res.data.data.id;
        show('Song created successfully.');
      }

      await api.put(`/admin/songs/${songId}/pricing`, {
        price_rwf: Number(form.price_rwf) || 0,
        price_usd: Number(form.price_usd) || 0,
        is_free: form.is_free,
      });

      setModalOpen(false);
      fetchSongs();
    } catch (err) {
      show(err.response?.data?.message || 'Could not save the song.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/songs/${deleting.id}`);
      show('Song deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchSongs();
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the song.', 'error');
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
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Manage Songs</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{songs.length} songs on this page.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Upload Song
        </button>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search songs…"
          aria-label="Search songs"
          className="input pl-11 pr-10"
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); setSearch(''); setPage(1); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <Loader />
      ) : songs.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          {search ? 'No songs match your search.' : 'No songs yet. Upload your first song!'}
        </div>
      ) : (
        <div className="card divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
          {songs.map((song) => (
            <div key={song.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {song.cover_url ? (
                  <img src={song.cover_url} alt={song.title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-gold/15" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{song.title}</p>
                    {song.featured && (
                      <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                        <FaStar className="h-2.5 w-2.5" /> Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {song.genre} • {song.release_date || 'No release date'} •{' '}
                    {song.is_free
                      ? 'Free'
                      : `${formatPrice(song.price_rwf, 'RWF')} / ${formatPrice(song.price_usd, 'USD')}`}{' '}
                    • {song.play_count || 0} plays
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => openEdit(song)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-gold hover:text-night dark:bg-white/10 dark:text-slate-300" aria-label={`Edit ${song.title}`}>
                  <FiEdit className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setDeleting(song); setConfirmOpen(true); }} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-white/10" aria-label={`Delete ${song.title}`}>
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Song form modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Song' : 'Upload Song'} maxWidth="max-w-3xl">
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Song Title" required>
            <input name="title" value={form.title} onChange={setField} className="input" placeholder="e.g. Imena Ryiza" required />
          </FormField>
          <FormField label="Genre">
            <input name="genre" value={form.genre} onChange={setField} className="input" placeholder="e.g. Gospel / Worship" />
          </FormField>
          <FormField label="Release Date">
            <input name="release_date" type="date" value={form.release_date} onChange={setField} className="input" />
          </FormField>
          <FormField label="Featured Song">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 dark:border-white/10">
              <input name="featured" type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="h-4 w-4 accent-gold" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Show as featured on the home page</span>
            </label>
          </FormField>
          <FormField label="Free to Listen">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 dark:border-white/10">
              <input name="is_free" type="checkbox" checked={form.is_free} onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.checked }))} className="h-4 w-4 accent-gold" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Everyone can play this track for free</span>
            </label>
          </FormField>
          <FormField label="Track Price (RWF)" hint={form.is_free ? 'Free tracks are always playable — no price is charged.' : 'Set 0 to make the track free.'}>
            <input name="price_rwf" type="number" min="0" step="100" value={form.price_rwf} disabled={form.is_free} onChange={setField} className="input disabled:opacity-50" />
          </FormField>
          <FormField label="Track Price (USD)" hint={form.is_free ? 'Free tracks are always playable — no price is charged.' : 'Set 0 to make the track free.'}>
            <input name="price_usd" type="number" min="0" step="0.5" value={form.price_usd} disabled={form.is_free} onChange={setField} className="input disabled:opacity-50" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description">
              <textarea name="description" rows={3} value={form.description} onChange={setField} className="input resize-y" placeholder="Short description of the song…" />
            </FormField>
          </div>

          <FormField label="Cover Image" hint="JPG, PNG or WebP. Max 8 MB. Replaces the current cover when edited.">
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
          </FormField>
          <FormField label="Audio File (MP3)" required={!editing} hint={editing ? 'Leave empty to keep the current audio.' : 'MP3, max 25 MB.'}>
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
          </FormField>

          <div className="sm:col-span-2">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Streaming & Download Links</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {LINK_FIELDS.map(([key, label]) => (
                <FormField key={key} label={label}>
                  <input name={key} value={form[key]} onChange={setField} className="input" placeholder="https://…" />
                </FormField>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Update Song' : 'Create Song'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Song"
        message={`Are you sure you want to delete "${deleting?.title}"? The audio and cover files will also be removed. This cannot be undone.`}
      />
    </div>
  );
}
