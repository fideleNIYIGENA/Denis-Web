import { Link } from 'react-router-dom';
import { FaArrowRight, FaUserPen } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage.jsx';

function formatNewsDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** News article card linking to the detail page. */
export default function NewsCard({ article, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="card group flex flex-col overflow-hidden"
    >
      <Link to={`/news/${article.slug}`} className="relative block">
        <LazyImage src={article.image_url} alt={article.title} className="aspect-video w-full" />
        {article.category && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold text-night">
            {article.category}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FaUserPen className="h-3 w-3" />
            {article.author || 'Denis Ndayishimiye'}
          </span>
          <span aria-hidden>•</span>
          <time dateTime={article.published_date}>{formatNewsDate(article.published_date)}</time>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-slate-900 dark:text-white">
          <Link to={`/news/${article.slug}`} className="transition hover:text-gold">
            {article.title}
          </Link>
        </h3>

        {article.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{article.description}</p>
        )}

        <Link
          to={`/news/${article.slug}`}
          className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-gold transition hover:gap-3"
        >
          Read More <FaArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}
