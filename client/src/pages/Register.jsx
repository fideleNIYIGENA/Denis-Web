import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUserPlus, FaEnvelopeCircleCheck } from 'react-icons/fa6';
import AuthShell from '../components/AuthShell.jsx';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import useSEO from '../hooks/useSEO.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Friendly, human-readable message for common Supabase signup errors. */
function friendlySignupError(err) {
  const msg = err?.message || '';
  if (/already registered/i.test(msg)) return 'An account with this email already exists. Please log in instead.';
  if (/password/i.test(msg)) return 'Password must meet the minimum security requirements.';
  if (/valid email/i.test(msg)) return 'Please enter a valid email address.';
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a moment and try again.';
  return msg;
}

export default function Register() {
  useSEO({ title: 'Create Account', description: 'Create a free account to like, comment and interact.' });
  const { register, configError } = useUserAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsConfirmation(false);

    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must include at least one letter and one number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await register(email.trim(), password);
      // When email confirmation is enabled, Supabase returns a user without a
      // session until the confirmation link is clicked.
      if (data?.session) {
        setNeedsConfirmation(false);
        window.location.href = '/account';
        return;
      }
      setNeedsConfirmation(true);
    } catch (err) {
      setError(friendlySignupError(err));
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <AuthShell eyebrow="Almost there" title="Check your inbox" subtitle={`We sent a confirmation link to ${email.trim()}.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
            <FaEnvelopeCircleCheck className="h-8 w-8" />
          </span>
          <p className="text-sm leading-relaxed text-slate-400">
            Click the link in the email to confirm your account, then log in.
          </p>
          <p className="text-xs text-slate-500">Didn't get it? Check your spam folder or try registering again.</p>
          <Link to="/login" className="btn-primary mt-2">Go to Login</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Join the family" title="Create Account" subtitle="Register to like, comment and subscribe.">
      {configError && (
        <p className="mb-5 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400">{configError}</p>
      )}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="reg-email" className="label">Email address</label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className="label">Password</label>
          <div className="relative">
            <input
              id="reg-password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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
          <p className="mt-1.5 text-xs text-slate-500">At least 8 characters with letters and numbers.</p>
        </div>

        <div>
          <label htmlFor="reg-confirm" className="label">Confirm password</label>
          <input
            id="reg-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="input"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <FaUserPlus className="h-4 w-4" />
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-gold transition hover:brightness-125">
          Log In
        </Link>
      </p>
    </AuthShell>
  );
}
