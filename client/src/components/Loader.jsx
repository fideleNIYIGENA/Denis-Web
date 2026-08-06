import { motion } from 'framer-motion';

/** Full-screen or inline loading indicator. */
export default function Loader({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-night">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
        <p className="font-display text-lg text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <motion.div
        className="h-10 w-10 rounded-full border-4 border-gold/20 border-t-gold"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
    </div>
  );
}
