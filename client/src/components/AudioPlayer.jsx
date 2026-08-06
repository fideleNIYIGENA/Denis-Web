import { useEffect, useRef, useState } from 'react';
import { FiPause, FiPlay } from 'react-icons/fi';

function format(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Accessible audio player with play/pause, seek bar and time display. */
export default function AudioPlayer({ src, title = 'Song preview' }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onTime = () => {
      setCurrent(el.currentTime);
      if (el.duration) setProgress((el.currentTime / el.duration) * 100);
    };
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
    };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
    }
  };

  const seek = (e) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    el.currentTime = pct * el.duration;
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3 dark:bg-night-800">
      <audio ref={audioRef} src={src} preload="metadata" title={title} />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-night transition hover:brightness-110"
      >
        {playing ? <FiPause className="h-4 w-4" /> : <FiPlay className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onClick={seek}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              const el = audioRef.current;
              if (el) el.currentTime += e.key === 'ArrowRight' ? 5 : -5;
            }
          }}
          className="h-1.5 w-full cursor-pointer rounded-full bg-slate-300 dark:bg-white/10"
        >
          <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>{format(current)}</span>
          <span>{duration ? format(duration) : ''}</span>
        </div>
      </div>
    </div>
  );
}
