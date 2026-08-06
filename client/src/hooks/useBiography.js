import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';

/**
 * Loads the admin-editable biography text from its fixed public URL.
 * Returns null until loaded (or when no URL is configured) so callers
 * can fall back to their built-in default content.
 */
export default function useBiography() {
  const { settings } = useData();
  const [biography, setBiography] = useState(null);

  useEffect(() => {
    if (!settings?.biography_url) {
      setBiography(null);
      return undefined;
    }
    let cancelled = false;
    fetch(settings.biography_url, { cache: 'no-store' })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => {
        if (!cancelled) setBiography(text.trim() || null);
      })
      .catch(() => {
        if (!cancelled) setBiography(null);
      });
    return () => {
      cancelled = true;
    };
  }, [settings?.biography_url]);

  return biography;
}
