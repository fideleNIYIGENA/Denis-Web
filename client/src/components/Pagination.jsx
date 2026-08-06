import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function pageList(current, total) {
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  return [...pages].sort((a, b) => a - b);
}

/** Accessible pagination control. */
export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = pageList(page, totalPages);

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-gold hover:text-gold disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
      >
        <FiChevronLeft />
      </button>

      {pages.map((p, i) => {
        const gap = i > 0 && p - pages[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {gap && <span className="px-1 text-slate-400">…</span>}
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                p === page
                  ? 'bg-gold-gradient text-night'
                  : 'border border-slate-300 text-slate-600 hover:border-gold hover:text-gold dark:border-white/10 dark:text-slate-300'
              }`}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-gold hover:text-gold disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
      >
        <FiChevronRight />
      </button>
    </nav>
  );
}
