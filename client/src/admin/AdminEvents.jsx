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
  event_date: '',
  venue: '',
  description: '',
  registration_link: '',
  status: 'upcoming',
  ticket_price: '',
};

export default function AdminEvents() {
  const { show } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [posterFile, setPosterFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/events', { params: { page, limit: 10, search } });
      setEvents(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, event_date: new Date().toISOString().slice(0, 10) });
    setPosterFile(null);
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title || '',
      event_date: ev.event_date || '',
      venue: ev.venue || '',
      description: ev.description || '',
      registration_link: ev.registration_link || '',
      status: ev.status || 'upcoming',
      ticket_price: ev.ticket_price ?? '',
    });
    setPosterFile(null);
    setModalOpen(true);
  };

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return show('Event title is required.', 'error');
    if (!form.event_date) return show('Event date is required.', 'error');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'ticket_price') return; // saved via the pricing endpoint
        fd.append(k, String(v ?? ''));
      });
      if (posterFile) fd.append('poster', posterFile);

      let eventId = editing?.id;
      if (editing) {
        await api.put(`/events/${editing.id}`, fd);
        show('Event updated successfully.');
      } else {
        const res = await api.post('/events', fd);
        eventId = res.data.data.id;
        show('Event created successfully.');
      }

      await api.put(`/admin/events/${eventId}/pricing`, {
        ticket_price: Number(form.ticket_price) || 0,
      });

      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      show(err.response?.data?.message || 'Could not save the event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/events/${deleting.id}`);
      show('Event deleted successfully.');
      setConfirmOpen(false);
      setDeleting(null);
      fetchEvents();
    } catch (err) {
      show(err.response?.data?.message || 'Could not delete the event.', 'error');
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
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Manage Events</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{events.length} events on this page.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <FiPlus className="h-4 w-4" /> Create Event
        </button>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-md">
        <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" aria-label="Search events" className="input pl-11 pr-10" />
        {q && (
          <button type="button" onClick={() => { setQ(''); setSearch(''); setPage(1); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold">
            <FiX className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <Loader />
      ) : events.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">{search ? 'No events match your search.' : 'No events yet.'}</div>
      ) : (
        <div className="card divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
          {events.map((ev) => (
            <div key={ev.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {ev.poster_url && <img src={ev.poster_url} alt={ev.title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">{ev.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ev.status === 'upcoming' ? 'bg-gold/15 text-gold' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                      {ev.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {ev.event_date || 'No date'} {ev.venue ? `• ${ev.venue}` : ''}{' '}
                    {Number(ev.ticket_price) > 0 ? `• RWF ${Number(ev.ticket_price).toLocaleString()} ticket` : ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => openEdit(ev)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-gold hover:text-night dark:bg-white/10 dark:text-slate-300" aria-label={`Edit ${ev.title}`}>
                  <FiEdit className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { setDeleting(ev); setConfirmOpen(true); }} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-white/10" aria-label={`Delete ${ev.title}`}>
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'Create Event'} maxWidth="max-w-2xl">
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Event Title" required>
              <input name="title" value={form.title} onChange={setField} className="input" required />
            </FormField>
          </div>
          <FormField label="Date" required>
            <input name="event_date" type="date" value={form.event_date} onChange={setField} className="input" required />
          </FormField>
          <FormField label="Venue">
            <input name="venue" value={form.venue} onChange={setField} className="input" placeholder="e.g. BK Arena, Kigali" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description">
              <textarea name="description" rows={3} value={form.description} onChange={setField} className="input resize-y" />
            </FormField>
          </div>
          <FormField label="Ticket Price (RWF)" hint="Set 0 for free entry.">
            <input name="ticket_price" type="number" min="0" step="500" value={form.ticket_price} onChange={setField} className="input" />
          </FormField>
          <FormField label="Status">
            <select name="status" value={form.status} onChange={setField} className="input">
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Registration Link" hint="Optional ticketing or registration URL.">
              <input name="registration_link" value={form.registration_link} onChange={setField} className="input" placeholder="https://…" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Poster Image" hint="JPG, PNG or WebP. Max 8 MB.">
              <input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
