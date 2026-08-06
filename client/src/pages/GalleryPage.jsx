import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';
import LazyImage from '../components/LazyImage.jsx';
import GalleryLightbox from '../components/GalleryLightbox.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';

export default function GalleryPage() {
  useSEO({
    title: 'Gallery',
    description: 'Photos from worship nights, concerts and ministry moments of Denis Ndayishimiye.',
    url: window.location.href,
  });

  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [album, setAlbum] = useState('');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (album) params.album = album;
      if (category) params.category = category;
      if (search) params.search = search;
      const res = await api.get('/gallery', { params });
      setImages(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setImages([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, album, category, search]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  useEffect(() => {
    Promise.all([api.get('/gallery/albums'), api.get('/gallery/categories')])
      .then(([a, c]) => {
        setAlbums(a.data.data || []);
        setCategories(c.data.data || []);
      })
      .catch(() => {});
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
        eyebrow="Moments"
        title="Gallery"
        subtitle="A visual journey through worship, concerts and ministry life."
        breadcrumb={[{ label: 'Gallery', to: '/gallery' }]}
      />

      <section className="py-14">
        <div className="container-x">
          <div className="card mb-10 flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <form onSubmit={submitSearch} className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search captions or albums…"
                aria-label="Search gallery"
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
              <select value={album} onChange={(e) => { setAlbum(e.target.value); setPage(1); }} className="input w-auto" aria-label="Filter by album">
                <option value="">All Albums</option>
                {albums.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input w-auto" aria-label="Filter by category">
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton aspect-[4/3]" />
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="group relative overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold"
                  aria-label={img.caption ? `View: ${img.caption}` : 'View image'}
                >
                  <LazyImage
                    src={img.image_url}
                    alt={img.caption || `Gallery image ${i + 1}`}
                    className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
                    <span className="text-left">
                      {img.album && <span className="block text-xs font-bold uppercase tracking-wide text-gold">{img.album}</span>}
                      {img.caption && <span className="block text-sm text-white">{img.caption}</span>}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-semibold text-slate-600 dark:text-slate-300">No photos found</p>
              <p className="mt-2 text-sm text-slate-500">Try different filters.</p>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      </section>

      <GalleryLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
