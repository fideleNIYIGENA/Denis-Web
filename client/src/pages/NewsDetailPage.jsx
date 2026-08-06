import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendarDays, FaShareNodes, FaUserPen } from 'react-icons/fa6';
import api from '../api/client.js';
import useSEO from '../hooks/useSEO.js';
import Loader from '../components/Loader.jsx';
import LazyImage from '../components/LazyImage.jsx';
import NotFoundPage from './NotFoundPage.jsx';

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSEO({
    title: article?.title,
    description: article?.description?.slice(0, 160),
    image: article?.image_url,
    url: window.location.href,
  });

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .get(`/news/${slug}`)
      .then((res) => setArticle(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loader />;
  if (notFound || !article) return <NotFoundPage />;

  const share = async () => {
    const data = { title: article.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(`${article.title} — ${window.location.href}`);
    } catch {
      // ignore
    }
  };

  return (
    <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Cover */}
      <section className="relative overflow-hidden bg-night pt-32 pb-16 sm:pt-40">
        {article.image_url && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${article.image_url})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-night" aria-hidden />
          </>
        )}
        <div className="container-x relative">
          <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-gold">
            <FaArrowLeft className="h-4 w-4" /> Back to News
          </Link>
          <p className="mt-6 inline-block rounded-full bg-gold-gradient px-4 py-1 text-xs font-bold text-night">
            {article.category || 'News'}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold text-white sm:text-5xl">{article.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <FaUserPen className="h-4 w-4 text-gold" /> {article.author || 'Denis Ndayishimiye'}
            </span>
            <span className="flex items-center gap-2">
              <FaCalendarDays className="h-4 w-4 text-gold" /> {formatDate(article.published_date)}
            </span>
            <button type="button" onClick={share} className="flex items-center gap-2 text-slate-300 transition hover:text-gold">
              <FaShareNodes className="h-4 w-4" /> Share
            </button>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-14">
        <div className="container-x max-w-3xl">
          {article.image_url && (
            <LazyImage src={article.image_url} alt={article.title} className="aspect-video w-full rounded-2xl" />
          )}
          <div className="prose mt-8 max-w-none text-slate-600 dark:text-slate-300">
            {article.description.split('\n').map((paragraph, i) =>
              paragraph.trim() ? <p key={i} className="mb-5 leading-relaxed">{paragraph}</p> : null
            )}
          </div>
        </div>
      </section>
    </motion.article>
  );
}
