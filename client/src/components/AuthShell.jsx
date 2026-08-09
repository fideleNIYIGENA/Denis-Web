import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa6';

/** Dark glass shell shared by the public account pages (login, register, …). */
export default function AuthShell({ eyebrow, title, subtitle, children, backTo = '/', footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night p-4 py-12">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 20%, rgba(255,162,1,0.22), transparent 50%), radial-gradient(circle at 80% 80%, rgba(163,230,53,0.15), transparent 50%)',
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 shadow-glass sm:p-10">
          <div className="text-center">
            <Link to="/" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient font-display text-2xl font-bold text-night shadow-glow">
              DN
            </Link>
            {eyebrow && <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>}
            <h1 className="mt-1 font-display text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          </div>

          <div className="mt-8">{children}</div>
        </div>

        {footer ?? (
          <Link to={backTo} className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-gold">
            <FaArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        )}
      </motion.div>
    </div>
  );
}
