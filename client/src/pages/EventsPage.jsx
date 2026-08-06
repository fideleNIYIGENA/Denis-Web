import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';
import EventCard from '../components/EventCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';

const TABS = [
  { key: '', label: 'All Events' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export default function EventsPage() {
  useSEO({
    title: 'Events',
    description: 'Upcoming concerts, worship nights and events with Denis Ndayishimiye. Register online.',
    url: window.location.href,
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('upcoming');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await api.get('/events', { params });
      setEvents(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setCount(res.data.count || 0);
    } catch {
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  };

  const changePage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageHeader
        eyebrow="Join Us"
        title="Events"
        subtitle="Worship nights, concerts and conferences — come and encounter God together."
        breadcrumb={[{ label: 'Events', to: '/events' }]}
      />

      <section className="py-14">
        <div className="container-x">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div role="tablist" aria-label="Event filters" className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={status === t.key}
                  onClick={() => {
                    setStatus(t.key);
                    setPage(1);
                  }}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    status === t.key ? 'bg-gold-gradient text-night' : 'bg-slate-100 text-slate-600 hover:text-gold dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={submitSearch} className="relative w-full lg:w-80">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events…"
                aria-label="Search events"
                className="input pl-11 pr-10"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    setSearch('');
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {search && (
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {count} event{count !== 1 ? 's' : ''} found
            </p>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-96" />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev, i) => (
                <EventCard key={ev.id} event={ev} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-semibold text-slate-600 dark:text-slate-300">No events found</p>
              <p className="mt-2 text-sm text-slate-500">Check back soon for new events.</p>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      </section>
    </>
  );
}
