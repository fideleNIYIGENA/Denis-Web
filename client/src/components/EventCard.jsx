import { Link } from 'react-router-dom';
import { FaLocationDot, FaCalendarDays, FaArrowRight } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage.jsx';

function formatEventDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/** Upcoming event card with poster, date, venue and registration link. */
export default function EventCard({ event, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="card group flex flex-col overflow-hidden"
    >
      <div className="relative">
        <LazyImage src={event.poster_url} alt={event.title} className="aspect-[16/10] w-full" />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
            event.status === 'upcoming' ? 'bg-gold-gradient text-night' : 'bg-white/85 text-slate-700'
          }`}
        >
          {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>

        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-2">
            <FaCalendarDays className="h-4 w-4 shrink-0 text-gold" />
            {formatEventDate(event.event_date)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-2">
              <FaLocationDot className="h-4 w-4 shrink-0 text-gold" />
              {event.venue}
            </p>
          )}
        </div>

        {event.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{event.description}</p>
        )}

        <div className="mt-auto pt-2">
          {event.registration_link ? (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary w-full text-center"
            >
              Register Now <FaArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link to="/contact" className="btn-outline w-full border-gold/40 text-center text-gold">
              Get Details
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
