import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaHouse,
  FaMusic,
  FaVideo,
  FaImages,
  FaCalendarDays,
  FaNewspaper,
  FaEnvelopeOpenText,
  FaUsers,
  FaLink,
  FaGear,
  FaUserGear,
  FaRightFromBracket,
  FaXmark,
  FaGlobe,
} from 'react-icons/fa6';
import { useAuth } from '../../contexts/AuthContext.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: FaHouse, end: true },
  { to: '/admin/songs', label: 'Songs', icon: FaMusic },
  { to: '/admin/videos', label: 'Videos', icon: FaVideo },
  { to: '/admin/gallery', label: 'Gallery', icon: FaImages },
  { to: '/admin/events', label: 'Events', icon: FaCalendarDays },
  { to: '/admin/news', label: 'News', icon: FaNewspaper },
  { to: '/admin/messages', label: 'Messages', icon: FaEnvelopeOpenText },
  { to: '/admin/subscribers', label: 'Subscribers', icon: FaUsers },
  { to: '/admin/social', label: 'Social Links', icon: FaLink },
  { to: '/admin/settings', label: 'Settings', icon: FaGear },
  { to: '/admin/profile', label: 'Profile', icon: FaUserGear },
];

export default function AdminSidebar({ open, onClose }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link to="/admin" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient font-display text-lg font-bold text-night">
            DN
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold text-white">Admin Panel</span>
            <span className="block text-[11px] text-slate-400">{admin?.name || 'Denis Ndayishimiye'}</span>
          </span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden">
          <FaXmark className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-gold-gradient text-night' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
          <FaGlobe className="h-4 w-4" /> View Website
        </Link>
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
          <FaRightFromBracket className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-night-800 lg:block">{content}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur lg:hidden"
            onClick={onClose}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute inset-y-0 left-0 w-64 border-r border-white/10 bg-night-800"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
