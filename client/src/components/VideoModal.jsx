import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaXmark, FaYoutube } from 'react-icons/fa6';

/** Modal that embeds a YouTube video (autoplay) with a "watch on YouTube" link. */
export default function VideoModal({ video, onClose }) {
  useEffect(() => {
    if (!video) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [video, onClose]);

  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Watch ${video.title}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-night"
          >
            <FaXmark className="h-5 w-5" />
          </button>

          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-glow">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-lg font-semibold text-white">{video.title}</h3>
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gold hover:text-night"
            >
              <FaYoutube className="h-4 w-4" /> Watch on YouTube
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
