import { FiMusic } from 'react-icons/fi';
import { FaSpotify, FaApple, FaHeadphones, FaYoutube, FaDownload } from 'react-icons/fa6';

/**
 * Row of streaming / download buttons for a song.
 * Only renders the links that exist for the song.
 */
export default function StreamingLinks({ song, compact = false }) {
  const links = [
    { key: 'spotify', label: 'Spotify', icon: FaSpotify, url: song.spotify_url },
    { key: 'apple_music', label: 'Apple Music', icon: FaApple, url: song.apple_music_url },
    { key: 'boomplay', label: 'Boomplay', icon: FiMusic, url: song.boomplay_url },
    { key: 'audiomack', label: 'Audiomack', icon: FaHeadphones, url: song.audiomack_url },
    { key: 'youtube', label: 'YouTube', icon: FaYoutube, url: song.youtube_url },
    { key: 'download', label: 'Download', icon: FaDownload, url: song.download_url },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <a
            key={l.key}
            href={l.url}
            target={l.key === 'download' ? '_blank' : '_blank'}
            rel="noreferrer noopener"
            aria-label={`${l.label} — ${song.title}`}
            className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 font-semibold text-slate-600 transition hover:bg-gold hover:text-night dark:bg-white/10 dark:text-slate-300 ${
              compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'
            }`}
          >
            <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {l.label}
          </a>
        );
      })}
    </div>
  );
}
