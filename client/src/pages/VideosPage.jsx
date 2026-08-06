import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';
import VideoCard from '../components/VideoCard.jsx';
import VideoModal from '../components/VideoModal.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';

export default function VideosPage() {
  useSEO({
    title: 'Videos',
    description: 'Watch worship sessions, live performances and ministry videos by Denis Ndayishimiye.',
    url: window.location.href,
  });

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playing, setPlaying] = useState(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      const res = await api.get('/videos', { params });
      setVideos(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setVideos([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

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
        eyebrow="Watch & Worship"
        title="Videos"
        subtitle="Live performances, worship sessions and ministry moments — watch and share."
        breadcrumb={[{ label: 'Videos', to: '/videos' }]}
      />

      <section className="py-14">
        <div className="container-x">
          <div className="card mb-10 flex flex-col gap-4 p-5 md:flex-row md:items-center">
            <form onSubmit={submitSearch} className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search videos…"
                aria-label="Search videos"
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

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton aspect-video" />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, i) => (
                <VideoCard key={video.id} video={video} index={i} onPlay={setPlaying} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-semibold text-slate-600 dark:text-slate-300">No videos found</p>
              <p className="mt-2 text-sm text-slate-500">Check back soon for new content.</p>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      </section>

      <VideoModal video={playing} onClose={() => setPlaying(null)} />
    </>
  );
}
