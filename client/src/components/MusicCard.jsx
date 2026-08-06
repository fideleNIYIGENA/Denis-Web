import { FiShare2 } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage.jsx';
import AudioPlayer from './AudioPlayer.jsx';
import StreamingLinks from './StreamingLinks.jsx';

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function shareSong(song) {
  const data = { title: `Listen to "${song.title}" by Denis Ndayishimiye`, url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch {
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(`${data.title} — ${data.url}`);
  } catch {
    // clipboard unavailable
  }
}

/** Beautiful song card with cover, meta, player and streaming links. */
export default function MusicCard({ song, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="card group flex flex-col overflow-hidden"
    >
      <div className="relative">
        {song.cover_url ? (
          <LazyImage src={song.cover_url} alt={`${song.title} cover`} className="aspect-square w-full" />
        ) : (
          <div className="skeleton aspect-square w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-night/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold backdrop-blur">
            {song.genre || 'Gospel'}
          </span>
          {song.featured && (
            <span className="flex items-center gap-1 rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold text-night">
              <FaStar className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => shareSong(song)}
            aria-label={`Share ${song.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-night transition hover:bg-gold"
          >
            <FiShare2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{song.title}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Released {formatDate(song.release_date)}
          </p>
        </div>

        {song.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{song.description}</p>
        )}

        <AudioPlayer src={song.audio_url} title={song.title} />

        <StreamingLinks song={song} compact />
      </div>
    </motion.article>
  );
}
