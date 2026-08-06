import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import Modal from './components/Modal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import FormField from './components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import Pagination from '../components/Pagination.jsx';

export default function AdminGallery() {
  const { show } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [album, setAlbum] = useState('');
  const [category, setCategory] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/gallery', { params: { page, limit: 12 } });
      setImages(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const upload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return show('Select at least one image.', 'error');
    setSaving(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      fd.append('album', album);
      fd.append('category', category);
      fd.append('caption', caption);
      const res = await api.post('/gallery', fd);
      show(res.data.message || 'Images uploaded successfully.');
      setUploadOpen(false);
      setFiles([]);
      setAlbum('');
      setCategory('');
      setCaption('');
      fetchGallery();
    } catch (err) {
      show(err.response?.data?.message || 'Could not upload images.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (img) => {
    setEditing(img);
    setEditCaption(img.caption || '');
    setEditAlbum(img.album || '');
    setEditCategory(img.category || '');
    setEditFile(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const fd = new FormData();
      fd.append('caption', editCaption);
      fd.append('album', editAlbum);
      fd.append('category', editCategory);
      if (editFile) fd.append('image', editFile);
      await api.put(`/gallery/${editing.id}`, fd);
      show('Image updated successfully.');
      setEditing(null);
      fetchGallery();
    } catch (err) {
      show(err.response?.data?.message || 'Could not update the image.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/gallery/${deleting.id}`);
      show('Image deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchGallery();
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the image.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Manage Gallery</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{images.length} images on this page.</p>
        </div>
        <button type="button" onClick={() => setUploadOpen(true)} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Upload Images
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : images.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">No images yet. Upload some!</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="card group overflow-hidden">
              <img src={img.image_url} alt={img.caption || 'Gallery image'} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="min-w-0 truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {img.caption || img.album || 'Untitled'}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => openEdit(img)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-gold hover:text-night dark:bg-white/10 dark:text-slate-300" aria-label="Edit image">
                    <FiEdit className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => { setDeleting(img); setConfirmOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-white/10" aria-label="Delete image">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Images" maxWidth="max-w-2xl">
        <form onSubmit={upload} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Images" required hint="Select one or more images (JPG, PNG, WebP). Up to 20 at once.">
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
            </FormField>
            {files.length > 0 && <p className="mt-2 text-xs text-slate-500">{files.length} file(s) selected.</p>}
          </div>
          <FormField label="Album">
            <input value={album} onChange={(e) => setAlbum(e.target.value)} className="input" placeholder="e.g. Worship Night 2026" />
          </FormField>
          <FormField label="Category">
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="e.g. Concerts" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Caption" hint="Applied to every image in this batch.">
              <input value={caption} onChange={(e) => setCaption(e.target.value)} className="input" placeholder="Optional caption…" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setUploadOpen(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Image" maxWidth="max-w-md">
        <form onSubmit={saveEdit} className="grid gap-5">
          {editing && <img src={editing.image_url} alt="Current" className="aspect-video w-full rounded-xl object-cover" />}
          <FormField label="Caption">
            <input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="input" />
          </FormField>
          <FormField label="Album">
            <input value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} className="input" />
          </FormField>
          <FormField label="Category">
            <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input" />
          </FormField>
          <FormField label="Replace Image">
            <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
          </FormField>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={editSaving} className="btn-primary">
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image from the gallery? This cannot be undone."
      />
    </div>
  );
}
