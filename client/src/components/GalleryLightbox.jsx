import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaXmark } from 'react-icons/fa6';

/** Full-screen gallery lightbox with keyboard + swipe-free arrow navigation. */
export default function GalleryLightbox({ images, index, onClose, onNavigate }) {
  const current = images[index];

  const prev = useCallback(() => onNavigate((index - 1 + images.length) % images.length), [index, images.length, onNavigate]);
  const next = useCallback(() => onNavigate((index + 1) % images.length), [index, images.length, onNavigate]);

  useEffect(() => {
    if (current === undefined) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [current, onClose, prev, next]);

  if (current === undefined) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 backdrop-blur sm:p-8"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">
            {index + 1} / {images.length}
            {current.caption && <span className="text-slate-500"> — {current.caption}</span>}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-night"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-night"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>

          <motion.img
            key={current.image_url}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            src={current.image_url}
            alt={current.caption || `Gallery image ${index + 1}`}
            className="max-h-[75vh] max-w-full rounded-xl object-contain"
          />

          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-night"
          >
            <FaChevronRight className="h-5 w-5" />
          </button>
        </div>

        <p className="pt-4 text-center text-sm text-slate-400">
          {current.album && <span className="font-semibold text-gold">{current.album}</span>}
          {current.category && <span className="ml-2 text-slate-500">{current.category}</span>}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
