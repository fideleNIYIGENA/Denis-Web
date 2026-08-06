import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import AdminSidebar from './components/AdminSidebar.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

/** Admin shell: sidebar + topbar + routed page content. */
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-night">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-white/10 dark:bg-night-800/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          </div>

          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {dark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
