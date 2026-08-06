import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

/** Gradient page banner with title + optional breadcrumb. */
export default function PageHeader({ eyebrow, title, subtitle, breadcrumb = [] }) {
  return (
    <section className="relative overflow-hidden bg-royal-hero pt-32 pb-16 text-white sm:pt-40 sm:pb-20">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,162,1,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(163,230,53,0.2), transparent 45%)',
        }}
      />
      <div className="container-x relative text-center">
        {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>}
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-slate-300">{subtitle}</p>}
        {breadcrumb.length > 0 && (
          <nav className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400" aria-label="Breadcrumb">
            <Link to="/" className="transition hover:text-gold">Home</Link>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <FiChevronRight className="h-3.5 w-3.5" />
                {crumb.to ? (
                  <Link to={crumb.to} className="transition hover:text-gold">{crumb.label}</Link>
                ) : (
                  <span className="text-gold">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
