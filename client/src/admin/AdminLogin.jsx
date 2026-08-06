import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaArrowLeft } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext.jsx';
import useSEO from '../hooks/useSEO.js';

export default function AdminLogin() {
  useSEO({ title: 'Admin Login', description: 'Administrator login.' });
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const from = location.state?.from || '/admin';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night p-4">
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
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient font-display text-2xl font-bold text-night shadow-glow">
              DN
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to manage the website.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="label">Username</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="DenisAdmin@web"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-gold"
                >
                  {show ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <FaLock className="h-4 w-4" />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-gold">
          <FaArrowLeft className="h-3.5 w-3.5" /> Back to website
        </Link>
      </motion.div>
    </div>
  );
}
