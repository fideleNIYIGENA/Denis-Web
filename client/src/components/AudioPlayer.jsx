import { useEffect, useRef } from 'react';
import { FiLock, FiPause, FiPlay, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { useAudio } from '../contexts/AudioContext.jsx';

function format(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Accessible audio player bound to the global AudioContext. Playback state and
 * the single HTMLAudioElement live in the provider, so only one track plays at
 * a time and it keeps playing across route changes.
 * - `locked`: playback is gated behind a purchase/subscription. Clicking play
 *   fires `onLocked` instead of starting the audio.
 * - `onStart`: called the moment playback actually begins (used for counters).
 * - `playSignal`: an integer that, when incremented, starts playback without a
 *   click — used after the email verification flow succeeds.
 */
export default function AudioPlayer({ src, title = 'Song preview', trackId = null, locked = false, onLocked, onStart, playSignal = 0 }) {
  const { track, playing, current, duration, progress, volume, muted, playTrack, togglePlay, seek, setVolume, toggleMute } =
    useAudio();

  const isCurrent = !!track && src === track.src;
  const isPlaying = isCurrent && playing;
  const lastSignal = useRef(0);

  // Progress/time is global to the shared element — only surface it on the card
  // whose track is loaded. Other cards keep their bar static.
  const showProgress = isCurrent ? progress : 0;
  const showCurrent = isCurrent ? current : 0;
  const showDuration = isCurrent ? duration : 0;

  // Autoplay requested after an access-gate (email verification) succeeds.
  useEffect(() => {
    if (playSignal === lastSignal.current) return;
    lastSignal.current = playSignal;
    if (playSignal > 0 && !locked) {
      playTrack({ id: trackId, src, title, onStart });
    }
  }, [playSignal, locked, src, title, trackId, onStart, playTrack]);

  const handleToggle = () => {
    if (locked) {
      onLocked?.();
      return;
    }
    if (isCurrent && playing) {
      togglePlay();
    } else {
      playTrack({ id: trackId, src, title, onStart });
    }
  };

  const handleSeek = (e) => {
    if (!isCurrent) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    seek(pct);
  };

  const nudgeSeek = (delta) => {
    if (!isCurrent || !showDuration) return;
    seek(Math.min(Math.max(showCurrent + delta, 0), showDuration) / showDuration);
  };

  const onVolume = (e) => setVolume(e.target.value / 100);

  const effectiveVolume = muted ? 0 : volume;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 dark:bg-night-800">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={locked ? `Unlock ${title}` : isPlaying ? 'Pause' : 'Play'}
        title={locked ? 'Unlock this track' : undefined}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-night transition hover:brightness-110"
      >
        {locked ? <FiLock className="h-4 w-4" /> : isPlaying ? <FiPause className="h-4 w-4" /> : <FiPlay className="ml-0.5 h-4 w-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(showProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onClick={handleSeek}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') nudgeSeek(5);
            if (e.key === 'ArrowLeft') nudgeSeek(-5);
          }}
          className="h-1.5 w-full cursor-pointer rounded-full bg-slate-300 dark:bg-white/10"
        >
          <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${showProgress}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>{format(showCurrent)}</span>
          <span>{showDuration ? format(showDuration) : ''}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Unmute' : 'Mute'}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:text-gold dark:text-slate-400"
        >
          {effectiveVolume === 0 ? <FiVolumeX className="h-4 w-4" /> : <FiVolume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(effectiveVolume * 100)}
          onChange={onVolume}
          aria-label={`Volume ${Math.round(effectiveVolume * 100)}%`}
          className="w-16 cursor-pointer accent-gold sm:w-24"
        />
      </div>
    </div>
  );
}
