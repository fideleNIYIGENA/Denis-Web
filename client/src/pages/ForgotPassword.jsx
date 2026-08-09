import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPaperPlane, FaEnvelopeCircleCheck } from 'react-icons/fa6';
import AuthShell from '../components/AuthShell.jsx';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import useSEO from '../hooks/useSEO.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  useSEO({ title: 'Forgot Password', description: 'Reset your Denis Ndayishimiye account password.' });
  const { resetPassword, configError } = useUserAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell eyebrow="Check your email" title="Reset link sent" subtitle={`We emailed a secure reset link to ${email.trim()}.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
            <FaEnvelopeCircleCheck className="h-8 w-8" />
          </span>
          <p className="text-sm leading-relaxed text-slate-400">
            Click the link in the email to choose a new password. The link expires after a short time.
          </p>
          <Link to="/login" className="btn-primary mt-2">Back to Login</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account recovery" title="Forgot Password?" subtitle="Enter your email and we'll send you a secure reset link.">
      {configError && (
        <p className="mb-5 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400">{configError}</p>
      )}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="forgot-email" className="label">Email address</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <FaPaperPlane className="h-4 w-4" />
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-gold transition hover:brightness-125">Log In</Link>
      </p>
    </AuthShell>
  );
}
