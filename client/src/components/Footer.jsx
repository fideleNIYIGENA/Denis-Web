import { Link } from 'react-router-dom';
import { FiArrowRight, FiLock, FiMusic } from 'react-icons/fi';
import SocialLinks from './SocialLinks.jsx';
import { useData } from '../contexts/DataContext.jsx';

const QUICK_LINKS = [
  { to: '/about', label: 'About Denis' },
  { to: '/biography', label: 'Biography' },
  { to: '/music', label: 'Music' },
  { to: '/videos', label: 'Videos' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events' },
  { to: '/news', label: 'News' },
  { to: '/contact', label: 'Contact' },
];

export default function Footer() {
  const { social } = useData();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-night-800 text-slate-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-night">
              DN
            </span>
            <span className="font-display text-lg font-semibold text-white">Denis Ndayishimiye</span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            Rwandan Gospel Artist, Guitarist, Singer-Songwriter, Music Producer and Worship Leader.
            Declaring the goodness of God through music.
          </p>
          <SocialLinks social={social} />
        </div>

        {/* Quick links */}
        <nav aria-label="Footer">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">Explore</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-gold">
                  <FiArrowRight className="h-3 w-3" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Listen */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">Listen</h3>
          <ul className="space-y-2 text-sm">
            {[
              { key: 'spotify', label: 'Spotify' },
              { key: 'apple_music', label: 'Apple Music' },
              { key: 'boomplay', label: 'Boomplay' },
              { key: 'audiomack', label: 'Audiomack' },
              { key: 'youtube', label: 'YouTube' },
            ].map((item) => {
              const value = social?.[item.key];
              if (!value) return null;
              return (
                <li key={item.key}>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-gold"
                  >
                    <FiMusic className="h-3.5 w-3.5" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">Contact</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {social?.email && (
              <li>
                <a href={`mailto:${social.email}`} className="transition hover:text-gold">{social.email}</a>
              </li>
            )}
            {social?.phone && <li>{social.phone}</li>}
            {social?.website && (
              <li>
                <a href={social.website} target="_blank" rel="noreferrer noopener" className="transition hover:text-gold">
                  {social.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
          </ul>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-night transition hover:brightness-110"
          >
            Book Denis / Get in touch
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Denis Ndayishimiye. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="transition hover:text-gold">Privacy Policy</Link>
            <Link to="/admin/login" className="inline-flex items-center gap-1 transition hover:text-gold">
              <FiLock className="h-3 w-3" /> Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
