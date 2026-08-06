import { Link } from 'react-router-dom';
import { FaHouse, FaMusic, FaArrowLeft } from 'react-icons/fa6';
import useSEO from '../hooks/useSEO.js';

export default function NotFoundPage() {
  useSEO({ title: 'Page Not Found', description: 'The page you are looking for could not be found.', url: window.location.href });

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-white px-4 pt-16 dark:bg-night">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-display text-8xl font-bold text-gradient sm:text-9xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Oops! Page Not Found
        </h1>
        <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">
          The page you are looking for might have been moved, renamed, or never existed. Let's get you back to the music.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/" className="btn-primary">
            <FaHome className="h-4 w-4" /> Back Home
          </Link>
          <Link to="/music" className="btn-outline border-gold/40 text-gold">
            <FaMusic className="h-4 w-4" /> Explore Music
          </Link>
        </div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mx-auto mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-gold dark:text-slate-400"
        >
          <FaArrowLeft className="h-3.5 w-3.5" /> Go back to previous page
        </button>
      </div>
    </section>
  );
}
