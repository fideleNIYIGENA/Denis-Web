import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  FaEnvelope,
  FaCalendarDays,
  FaCrown,
  FaRightFromBracket,
  FaKey,
  FaCircleCheck,
  FaClockRotateLeft,
  FaCircleXmark,
  FaUserPen,
} from 'react-icons/fa6';
import { FiSave } from 'react-icons/fi';
import PageHeader from '../components/PageHeader.jsx';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import userApi from '../api/userClient.js';
import useSEO from '../hooks/useSEO.js';

const SUB_LABEL = {
  active: { text: 'Active', tone: 'bg-royal/15 text-royal-500', icon: FaCircleCheck },
  pending: { text: 'Pending Approval', tone: 'bg-gold/15 text-gold', icon: FaClockRotateLeft },
  expired: { text: 'Expired', tone: 'bg-amber-500/15 text-amber-500', icon: FaCircleXmark },
  cancelled: { text: 'Cancelled', tone: 'bg-red-500/15 text-red-500', icon: FaCircleXmark },
  inactive: { text: 'Inactive', tone: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400', icon: FaCircleXmark },
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AccountPage() {
  useSEO({ title: 'My Account', description: 'Manage your Denis Ndayishimiye account.' });
  const { isAuthenticated, loading, profile, subscription, logout, changePassword, refreshProfile } = useUserAuth();
  const navigateTo = null;

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [changing, setChanging] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const subMeta = SUB_LABEL[subscription.status] || SUB_LABEL.inactive;
  const SubIcon = subMeta.icon;

  const saveName = async (e) => {
    e.preventDefault();
    setNameMessage('');
    setSavingName(true);
    try {
      await userApi.put('/users/profile', { display_name: displayName.trim() });
      await refreshProfile();
      setNameMessage('Display name saved.');
    } catch (err) {
      setNameMessage(err.response?.data?.message || 'Could not save your display name.');
    } finally {
      setSavingName(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setChanging(true);
    try {
      await changePassword(newPassword);
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      setPwError(err.message || 'Could not change your password.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Your Account"
        title="My Account"
        subtitle="View your profile, subscription and security settings."
        breadcrumb={[{ label: 'Account', to: '/account' }]}
      />

      <section className="py-14">
        <div className="container-x">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile summary */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient font-display text-xl font-bold text-night">
                  {(profile?.display_name || profile?.email || 'U').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold text-slate-900 dark:text-white">
                    {profile?.display_name || 'Member'}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    <FaEnvelope className="h-3 w-3" /> {profile?.email}
                  </p>
                </div>
              </div>

              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">Member since</dt>
                  <dd className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <FaCalendarDays className="h-3.5 w-3.5 text-gold" /> {formatDate(profile?.created_at)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">Subscription</dt>
                  <dd className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${subMeta.tone}`}>
                      <SubIcon className="h-3 w-3" /> {subMeta.text}
                    </span>
                  </dd>
                </div>
                {subscription.expires_at && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">Subscription expires</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(subscription.expires_at)}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 space-y-2">
                <Link to="/subscribe" className="btn-primary w-full">
                  <FaCrown className="h-4 w-4" />
                  {subscription.status === 'active' ? 'Manage Subscription' : 'Subscribe'}
                </Link>
                <button type="button" onClick={logout} className="btn-outline w-full border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                  <FaRightFromBracket className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>

            {/* Display name + change password */}
            <div className="space-y-6 lg:col-span-2">
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
                  <FaUserPen className="h-4 w-4 text-gold" /> Profile
                </h3>
                <form onSubmit={saveName} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="display-name" className="label">Display name (shown with your comments)</label>
                    <input
                      id="display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={80}
                      className="input"
                      placeholder="Your name"
                    />
                  </div>
                  <button type="submit" disabled={savingName} className="btn-primary shrink-0">
                    <FiSave className="h-4 w-4" />
                    {savingName ? 'Saving…' : 'Save Name'}
                  </button>
                </form>
                {nameMessage && <p className="mt-2 text-xs font-medium text-gold">{nameMessage}</p>}
              </div>

              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
                  <FaKey className="h-4 w-4 text-gold" /> Change Password
                </h3>
                <form onSubmit={submitPassword} className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label htmlFor="new-password" className="label">New password</label>
                    <input
                      id="new-password"
                      type={show ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="input"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="confirm-password" className="label">Confirm new password</label>
                    <input
                      id="confirm-password"
                      type={show ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="input"
                      placeholder="Repeat new password"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? 'Hide passwords' : 'Show passwords'}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:text-gold dark:border-white/10 dark:text-slate-300"
                    >
                      {show ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {pwError && (
                    <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500 sm:col-span-3">{pwError}</p>
                  )}
                  {pwSuccess && (
                    <p className="rounded-xl bg-royal/10 px-4 py-3 text-sm font-medium text-royal-500 sm:col-span-3">
                      Password updated successfully. Next time you log in, use your new password.
                    </p>
                  )}

                  <div className="sm:col-span-3">
                    <button type="submit" disabled={changing} className="btn-primary w-full sm:w-auto">
                      <FaKey className="h-4 w-4" />
                      {changing ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
