import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';
import MusicCard from '../components/MusicCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';

export default function MusicPage() {
  useSEO({
    title: 'Music',
    description: 'Stream and download worship music by Denis Ndayishimiye — search songs, filter by genre and enjoy the latest gospel releases.',
    url: window.location.href,
  });

  const [songs, setSongs] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (genre) params.genre = genre;
      const res = await api.get('/songs', { params });
      setSongs(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setCount(res.data.count || 0);
    } catch {
      setSongs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, genre]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    api.get('/songs/genres').then((r) => setGenres(r.data.data || [])).catch(() => {});
  }, []);

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
        eyebrow="Discography"
        title="Music"
        subtitle="Stream, worship and be encouraged. Search the discography or filter by genre."
        breadcrumb={[{ label: 'Music', to: '/music' }]}
      />

      <section className="py-14">
        <div className="container-x">
          {/* Search + filters */}
          <div className="card mb-10 flex flex-col gap-4 p-5 md:flex-row md:items-center">
            <form onSubmit={submitSearch} className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search songs by title, genre or description…"
                aria-label="Search songs"
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setGenre('');
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  genre === '' ? 'bg-gold-gradient text-night' : 'bg-slate-100 text-slate-600 hover:text-gold dark:bg-white/10 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGenre(genre === g ? '' : g);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    genre === g ? 'bg-gold-gradient text-night' : 'bg-slate-100 text-slate-600 hover:text-gold dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {search && (
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {count} result{count !== 1 ? 's' : ''} for <span className="font-semibold text-gold">"{search}"</span>
            </p>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-[480px]" />
              ))}
            </div>
          ) : songs.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {songs.map((song, i) => (
                <MusicCard key={song.id} song={song} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-semibold text-slate-600 dark:text-slate-300">No songs found</p>
              <p className="mt-2 text-sm text-slate-500">Try a different search term or genre.</p>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      </section>
    </>
  );
}
