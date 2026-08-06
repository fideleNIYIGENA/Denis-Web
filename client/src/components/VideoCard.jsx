import { FaPlay, FaStar } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage.jsx';

export function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Video card with hover play overlay; triggers the page's embed modal. */
export default function VideoCard({ video, index = 0, onPlay }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="card group cursor-pointer overflow-hidden"
      onClick={() => onPlay(video)}
    >
      <div className="relative">
        <LazyImage src={video.thumbnail_url} alt={video.title} className="aspect-video w-full" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient text-night shadow-glow">
            <FaPlay className="ml-1 h-5 w-5" />
          </span>
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {video.is_short ? (
            <span className="rounded-full bg-red-500/90 px-3 py-1 text-[11px] font-bold text-white">SHORT</span>
          ) : (
            <span className="rounded-full bg-night/70 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Video
            </span>
          )}
          {video.featured && (
            <span className="flex items-center gap-1 rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold text-night">
              <FaStar className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
        {formatDuration(video.duration) && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{video.title}</h3>
        {video.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {video.description}
          </p>
        )}
      </div>
    </motion.article>
  );
}
