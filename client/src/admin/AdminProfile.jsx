import { useEffect, useState } from 'react';
import { FiSave, FiEye, FiEyeOff, FiUpload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import FormField from './components/FormField.jsx';

export default function AdminProfile() {
  const { admin } = useAuth();
  const { show } = useToast();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const [profileImage, setProfileImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setProfileImage(res.data.data?.profile_image_url || ''))
      .catch(() => {});
  }, []);

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const savePicture = async (e) => {
    e.preventDefault();
    if (!imageFile) return show('Choose an image to upload first.', 'error');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      await api.put('/settings', fd);
      setProfileImage(`${profileImage.split('?')[0]}?t=${Date.now()}`);
      setImageFile(null);
      show('Profile picture updated successfully.');
    } catch (err) {
      show(err.response?.data?.message || 'Could not upload the profile picture.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return show('New passwords do not match.', 'error');
    if (form.newPassword.length < 8) return show('New password must be at least 8 characters.', 'error');

    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      show('Password changed successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      show(err.response?.data?.message || 'Could not change the password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const PwInput = ({ name, value, show, onToggle, placeholder, autoComplete }) => (
    <div className="relative">
      <input
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={setField}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="input pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-gold"
      >
        {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Profile</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the site profile picture and change the administrator password.</p>
      </div>

      <div className="card max-w-2xl p-6 sm:p-8">
        <form onSubmit={savePicture} className="space-y-5">
          <FormField label="Profile Picture" hint="Shown on the Biography, About and home pages. JPG, PNG or WebP, max 8 MB.">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {profileImage ? (
                <img src={profileImage} alt="Current profile" className="h-28 w-24 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 dark:bg-white/5">No image</div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="input file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-gold"
              />
            </div>
          </FormField>
          <div className="flex justify-end">
            <button type="submit" disabled={uploading} className="btn-primary">
              <FiUpload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Update Picture'}
            </button>
          </div>
        </form>
      </div>

      <div className="card max-w-2xl p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient font-display text-xl font-bold text-night">
            {admin?.name?.[0] || 'D'}
          </span>
          <div>
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{admin?.name || 'Administrator'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{admin?.username || admin?.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-5">
          <FormField label="Current Password" required>
            <PwInput
              name="currentPassword"
              value={form.currentPassword}
              show={showPw.current}
              onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </FormField>
          <FormField label="New Password" required hint="At least 8 characters.">
            <PwInput
              name="newPassword"
              value={form.newPassword}
              show={showPw.next}
              onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))}
              placeholder="New password"
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Confirm New Password" required>
            <PwInput
              name="confirmPassword"
              value={form.confirmPassword}
              show={showPw.confirm}
              onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </FormField>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              <FiSave className="h-4 w-4" /> {saving ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
