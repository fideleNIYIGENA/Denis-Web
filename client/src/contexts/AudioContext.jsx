import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AudioContext = createContext(null);

const VOLUME_KEY = 'dn_audio_volume';
const MUTED_KEY = 'dn_audio_muted';
const STATE_KEY = 'dn_audio_state';

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

function readSavedState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Global audio playback context.
 *
 * A single HTMLAudioElement lives here, mounted at the top root of the app
 * (outside the page routes), so playback continues seamlessly during in-app
 * navigation. Only one track can play at a time: starting a new track replaces
 * the current one on the shared element.
 *
 * Persistence:
 * - volume / mute → localStorage
 * - last track + position → sessionStorage, restored paused on full reload
 *   (browsers block autoplay, so a reload never force-plays audio).
 */
export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = new Audio();

  const [track, setTrack] = useState(null); // { id, src, title }
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const n = Number(readLS(VOLUME_KEY, '0.8'));
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 1) : 0.8;
  });
  const [muted, setMutedState] = useState(() => readLS(MUTED_KEY, 'false') === 'true');
  const lastVolume = useRef(volume);

  const el = audioRef.current;

  // Keep the element's volume / mute in sync with state.
  useEffect(() => {
    el.volume = volume;
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      // storage unavailable
    }
  }, [volume, el]);

  useEffect(() => {
    el.muted = muted;
    try {
      localStorage.setItem(MUTED_KEY, String(muted));
    } catch {
      // storage unavailable
    }
  }, [muted, el]);

  // Wire up element events once.
  useEffect(() => {
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
    const onError = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('error', onError);
    };
  }, [el]);

  // Restore the last track (paused) after a full page reload.
  useEffect(() => {
    const saved = readSavedState();
    if (!saved || !saved.src) return;
    setTrack({ id: saved.id ?? null, src: saved.src, title: saved.title ?? '' });
    el.src = saved.src;
    const onMeta = () => {
      try {
        if (saved.currentTime > 0) el.currentTime = saved.currentTime;
      } catch {
        // ignore
      }
      el.removeEventListener('loadedmetadata', onMeta);
    };
    el.addEventListener('loadedmetadata', onMeta);
  }, [el]);

  // Keep the last track + position so a full page reload can restore them.
  useEffect(() => {
    const persist = () => {
      try {
        sessionStorage.setItem(
          STATE_KEY,
          JSON.stringify({
            id: track?.id ?? null,
            src: track?.src ?? null,
            title: track?.title ?? null,
            currentTime: el.currentTime || 0,
          })
        );
      } catch {
        // storage unavailable
      }
    };
    window.addEventListener('beforeunload', persist);
    return () => window.removeEventListener('beforeunload', persist);
  }, [track, el]);

  const playTrack = useCallback(
    ({ id, src, title, onStart }) => {
      if (!src) return;
      const isSame = src === track?.src;
      setTrack({ id: id ?? null, src, title: title ?? '' });
      if (!isSame) {
        // Single-track enforcement: stop whatever is playing and reset state
        // before switching to the newly selected song.
        setCurrent(0);
        setProgress(0);
        setDuration(0);
        el.pause();
        el.currentTime = 0;
        el.src = src;
      }
      el.play()
        .then(() => {
          setPlaying(true);
          onStart?.();
        })
        .catch(() => setPlaying(false));
    },
    [track?.src, el]
  );

  const togglePlay = useCallback(() => {
    if (el.paused) {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [el]);

  const seek = useCallback(
    (pct) => {
      if (!el.duration) return;
      el.currentTime = Math.min(Math.max(pct, 0), 1) * el.duration;
    },
    [el]
  );

  const setVolume = useCallback(
    (v) => {
      const next = Math.min(Math.max(Number(v) || 0, 0), 1);
      el.volume = next;
      lastVolume.current = next;
      setVolumeState(next);
      if (next > 0 && el.muted) {
        el.muted = false;
        setMutedState(false);
      }
    },
    [el]
  );

  const toggleMute = useCallback(() => {
    if (el.muted) {
      const restore = lastVolume.current || 0.8;
      el.muted = false;
      el.volume = restore;
      setVolumeState(restore);
      setMutedState(false);
    } else {
      lastVolume.current = el.volume || volume;
      el.muted = true;
      setMutedState(true);
    }
  }, [el, volume]);

  const value = useMemo(
    () => ({
      track,
      playing,
      current,
      duration,
      progress,
      volume,
      muted,
      playTrack,
      togglePlay,
      seek,
      setVolume,
      toggleMute,
    }),
    [track, playing, current, duration, progress, volume, muted, playTrack, togglePlay, seek, setVolume, toggleMute]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider');
  return ctx;
};
