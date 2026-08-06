import { useEffect, useState } from 'react';
import { FiSave } from 'react-icons/fi';
import api from '../api/client.js';
import { useToast } from './components/Toast.jsx';
import FormField from './components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import useBiography from '../hooks/useBiography.js';

const EDITABLE_FIELDS = [
  'site_name',
  'site_tagline',
  'site_description',
  'hero_title',
  'hero_subtitle',
  'hero_image_url',
  'hero_video_url',
  'about_summary',
  'contact_address',
];

export default function AdminSettings() {
  const { show } = useToast();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const biography = useBiography();

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setForm(res.data.data || {}))
      .catch(() => show('Could not load settings.', 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  // Load the current biography text into the editor once it arrives.
  useEffect(() => {
    if (biography != null) setForm((f) => (f.bio === undefined ? { ...f, bio: biography } : f));
  }, [biography]);

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      EDITABLE_FIELDS.forEach((k) => fd.append(k, String(form[k] ?? '')));
      if (form.bio !== undefined && form.bio.trim() !== '') fd.append('bio', form.bio);
      if (imageFile) fd.append('image', imageFile);
      await api.put('/settings', fd);
      show('Settings updated successfully.');
      setImageFile(null);
    } catch (err) {
      show(err.response?.data?.message || 'Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure site-wide content such as the site name, hero section, profile picture and biography.
        </p>
      </div>

      <form onSubmit={save} className="card p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Site Name">
            <input name="site_name" value={form.site_name || ''} onChange={setField} className="input" />
          </FormField>
          <FormField label="Tagline">
            <input name="site_tagline" value={form.site_tagline || ''} onChange={setField} className="input" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Site Description (meta + home)">
              <textarea name="site_description" rows={3} value={form.site_description || ''} onChange={setField} className="input resize-y" />
            </FormField>
          </div>
          <FormField label="Hero Title">
            <input name="hero_title" value={form.hero_title || ''} onChange={setField} className="input" />
          </FormField>
          <FormField label="Hero Subtitle">
            <input name="hero_subtitle" value={form.hero_subtitle || ''} onChange={setField} className="input" />
          </FormField>
          <FormField label="Hero Background Image URL" hint="Optional — upload the image to any host and paste its URL here.">
            <input name="hero_image_url" value={form.hero_image_url || ''} onChange={setField} className="input" placeholder="https://…" />
          </FormField>
          <FormField label="Hero Video URL" hint="Optional video used in the hero background.">
            <input name="hero_video_url" value={form.hero_video_url || ''} onChange={setField} className="input" placeholder="https://…" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="About Summary" hint="Short paragraph shown on the home page biography preview.">
              <textarea name="about_summary" rows={4} value={form.about_summary || ''} onChange={setField} className="input resize-y" />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Contact Address">
              <input name="contact_address" value={form.contact_address || ''} onChange={setField} className="input" />
            </FormField>
          </div>
        </div>

        <div className="mt-8 grid gap-5 border-t border-slate-200 pt-8 dark:border-white/10">
          <div className="sm:col-span-2">
            <FormField label="Profile Picture" hint="Shown on the Biography, About and home pages. JPG, PNG or WebP, max 8 MB.">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {form.profile_image_url ? (
                  <img src={`${form.profile_image_url}?t=${Date.now()}`} alt="Current profile" className="h-28 w-24 shrink-0 rounded-xl object-cover" />
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
          </div>

          <div className="sm:col-span-2">
            <FormField label="Biography" hint="Full biography shown on the /biography page. Use blank lines between paragraphs.">
              <textarea name="bio" rows={14} value={form.bio || ''} onChange={setField} className="input resize-y font-mono text-sm" placeholder="Write the full biography here…" />
            </FormField>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <FiSave className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
