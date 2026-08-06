import { useEffect, useState } from 'react';
import { FiSave } from 'react-icons/fi';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import FormField from './components/FormField.jsx';
import Loader from '../components/Loader.jsx';

const FIELDS = [
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'tiktok', label: 'TikTok URL' },
  { key: 'youtube', label: 'YouTube URL' },
  { key: 'spotify', label: 'Spotify URL' },
  { key: 'apple_music', label: 'Apple Music URL' },
  { key: 'boomplay', label: 'Boomplay URL' },
  { key: 'audiomack', label: 'Audiomack URL' },
  { key: 'x_twitter', label: 'X (Twitter) URL' },
  { key: 'threads', label: 'Threads URL' },
  { key: 'whatsapp', label: 'WhatsApp Number', hint: 'e.g. 2507XXXXXXX (with country code, no +)' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'website', label: 'Website URL' },
];

export default function AdminSocial() {
  const { show } = useToast();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/social-links')
      .then((res) => setForm(res.data.data || {}))
      .catch(() => show('Could not load social links.', 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/social-links', form);
      show('Social links updated successfully.');
    } catch (err) {
      show(err.response?.data?.message || 'Could not save social links.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Social Links</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          These links automatically appear in the website footer and contact page. Leave a field empty to hide that platform.
        </p>
      </div>

      <form onSubmit={save} className="card p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <FormField key={f.key} label={f.label} hint={f.hint}>
              <input name={f.key} value={form[f.key] || ''} onChange={setField} className="input" placeholder="https://…" />
            </FormField>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <FiSave className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Social Links'}
          </button>
        </div>
      </form>
    </div>
  );
}
