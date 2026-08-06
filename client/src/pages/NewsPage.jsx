import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import PageHeader from '../components/PageHeader.jsx';
import NewsCard from '../components/NewsCard.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';

export default function NewsPage() {
  useSEO({
    title: 'News',
    description: 'Latest updates, announcements and ministry news from Denis Ndayishimiye.',
    url: window.location.href,
  });

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (category) params.category = category;
      if (search) params.search = search;
      const res = await api.get('/news', { params });
      setArticles(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setArticles([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    api.get('/news/categories').then((r) => setCategories(r.data.data || [])).catch(() => {});
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
        eyebrow="Updates"
        title="News"
        subtitle="News, announcements and stories from the ministry."
        breadcrumb={[{ label: 'News', to: '/news' }]}
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
                placeholder="Search news…"
                aria-label="Search news"
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
                onClick={() => { setCategory(''); setPage(1); }}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  category === '' ? 'bg-gold-gradient text-night' : 'bg-slate-100 text-slate-600 hover:text-gold dark:bg-white/10 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCategory(category === c ? '' : c); setPage(1); }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    category === c ? 'bg-gold-gradient text-night' : 'bg-slate-100 text-slate-600 hover:text-gold dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-80" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, i) => (
                <NewsCard key={a.id} article={a} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-semibold text-slate-600 dark:text-slate-300">No articles found</p>
              <p className="mt-2 text-sm text-slate-500">Check back soon for new updates.</p>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      </section>
    </>
  );
}
