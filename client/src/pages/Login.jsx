import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaRightToBracket } from 'react-icons/fa6';
import AuthShell from '../components/AuthShell.jsx';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import useSEO from '../hooks/useSEO.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  useSEO({ title: 'Login', description: 'Log in to your Denis Ndayishimiye account.' });
  const { isAuthenticated, loading: authLoading, login, configError } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/account" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      const from = location.state?.from || '/account';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Log In" subtitle="Access your account, subscription and interactions.">
      {configError && (
        <p className="mb-5 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400">{configError}</p>
      )}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="label">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="label">Password</label>
          <div className="relative">
            <input
              id="login-password"
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

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-semibold text-gold transition hover:brightness-125">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <FaRightToBracket className="h-4 w-4" />
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-gold transition hover:brightness-125">
          Create Account
        </Link>
      </p>
    </AuthShell>
  );
}
