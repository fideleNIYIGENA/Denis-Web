import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX, FiMoon, FiSun, FiMusic } from 'react-icons/fi';
import { FaCrown, FaRightFromBracket, FaUser } from 'react-icons/fa6';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import CheckoutModal from './CheckoutModal.jsx';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/biography', label: 'Biography' },
  { to: '/music', label: 'Music' },
  { to: '/videos', label: 'Videos' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events' },
  { to: '/news', label: 'News' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const { isAuthenticated, isSubscribed, profile, logout } = useUserAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const transparent = pathname === '/' && !scrolled && !open;

  return (
    <>
      <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'border-b border-white/10 bg-white/80 shadow-card backdrop-blur-xl dark:bg-night/80'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4 lg:h-20" aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-night shadow-glow">
            DN
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className={`font-display text-base font-semibold ${transparent ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              Denis Ndayishimiye
            </span>
            <span className="text-[11px] uppercase tracking-widest text-gold">Gospel Artist</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 xl:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-royal/15 text-royal-300'
                      : transparent
                        ? 'text-white/80 hover:text-gold'
                        : 'text-slate-600 hover:text-royal dark:text-slate-300 dark:hover:text-royal-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Account + Subscribe (desktop) */}
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    transparent ? 'text-white/80 hover:text-gold' : 'text-slate-600 hover:text-royal dark:text-slate-300 dark:hover:text-royal-300'
                  }`}
                >
                  <FaUser className="h-3.5 w-3.5" /> My Account
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Logout"
                  title="Logout"
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    transparent
                      ? 'text-white/80 hover:bg-white/10 hover:text-red-400'
                      : 'text-slate-500 hover:bg-red-500/10 hover:text-red-500 dark:text-slate-400'
                  }`}
                >
                  <FaRightFromBracket className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  transparent ? 'text-white/80 hover:text-gold' : 'text-slate-600 hover:text-gold dark:text-slate-300 dark:hover:text-gold'
                }`}
              >
                Login
              </Link>
            )}

            {isAuthenticated ? (
              <Link
                to="/subscribe"
                className="flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-night shadow-glow transition hover:brightness-110"
              >
                <FaCrown className="h-3.5 w-3.5" /> {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSubOpen(true)}
                className="flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-night shadow-glow transition hover:brightness-110"
              >
                <FaCrown className="h-3.5 w-3.5" /> Subscribe
              </button>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
              transparent
                ? 'text-white hover:bg-white/10'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            {dark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className={`flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition xl:hidden ${
              transparent
                ? 'text-white hover:bg-white/10'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-white/10 bg-white/95 backdrop-blur-xl dark:bg-night/95 xl:hidden"
          >
            <ul className="container-x flex flex-col gap-1 py-4">
              {isAuthenticated ? (
                <li className="mb-1 flex items-center gap-2">
                  <NavLink
                    to="/account"
                    className="flex flex-1 items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-royal dark:bg-white/10 dark:text-slate-200"
                  >
                    <FaUser className="h-4 w-4" /> My Account
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-500/10 hover:text-red-500 dark:bg-white/10 dark:text-slate-300"
                  >
                    <FaRightFromBracket className="h-4 w-4" /> Logout
                  </button>
                </li>
              ) : (
                <li className="mb-1">
                  <NavLink
                    to="/login"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-royal dark:bg-white/10 dark:text-slate-200"
                  >
                    Login
                  </NavLink>
                </li>
              )}
              {isAuthenticated ? (
                <li>
                  <NavLink
                    to="/subscribe"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl bg-gold-gradient px-4 py-3 text-sm font-semibold text-night"
                  >
                    <FaCrown className="h-4 w-4" />
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </NavLink>
                </li>
              ) : (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSubOpen(true);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl bg-gold-gradient px-4 py-3 text-sm font-semibold text-night"
                  >
                    <FaCrown className="h-4 w-4" />
                    Subscribe
                  </button>
                </li>
              )}
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-royal/15 text-royal-300'
                          : 'text-slate-700 hover:bg-royal/10 hover:text-royal dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-royal-300'
                      }`
                    }
                  >
                    <FiMusic className="h-4 w-4 opacity-60" />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      </header>

      <CheckoutModal
        open={subOpen}
        onClose={() => setSubOpen(false)}
        type="subscription"
        lockedEmail={isAuthenticated ? profile?.email || '' : ''}
      />
    </>
  );
}
