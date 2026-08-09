import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaKey, FaCircleCheck } from 'react-icons/fa6';
import AuthShell from '../components/AuthShell.jsx';
import { supabase } from '../lib/supabase.js';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import useSEO from '../hooks/useSEO.js';

/**
 * Password reset page.
 *
 * Supabase sends a secure link that carries a one-time recovery token in the
 * URL hash (`#access_token=...&type=recovery`). The Supabase client detects it
 * and opens a recovery session; the user then sets a new password with
 * `updateUser`. Afterward we sign out so they log in with the new password.
 */
export default function ResetPassword() {
  useSEO({ title: 'Reset Password', description: 'Choose a new password for your account.' });
  const { changePassword, logout } = useUserAuth();

  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Wait for Supabase to exchange the recovery token in the URL hash.
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return undefined;
    }
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecovery(true);
        setReady(true);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        if (data.session) setHasRecovery(true);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
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
      await changePassword(password);
      await logout();
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not update your password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell eyebrow="All set" title="Password updated" subtitle="Your password has been changed.">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-royal/15 text-royal-400">
            <FaCircleCheck className="h-8 w-8" />
          </span>
          <p className="text-sm leading-relaxed text-slate-400">You can now log in with your new password.</p>
          <Link to="/login" className="btn-primary mt-2">Log In</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account recovery" title="Reset Password" subtitle="Choose a new password for your account.">
      {!ready ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
      ) : !hasRecovery ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400">
            This reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn-primary mt-2">Request a New Link</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="reset-password" className="label">New password</label>
            <div className="relative">
              <input
                id="reset-password"
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
            <label htmlFor="reset-confirm" className="label">Confirm new password</label>
            <input
              id="reset-confirm"
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
            <FaKey className="h-4 w-4" />
            {loading ? 'Saving…' : 'Save New Password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
