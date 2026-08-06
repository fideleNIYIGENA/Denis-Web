import { motion } from 'framer-motion';

/** Centered section heading with an eyebrow label. */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className={`max-w-2xl ${alignClass} mb-10`}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </motion.div>
  );
}
