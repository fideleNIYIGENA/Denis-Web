import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const DataContext = createContext({
  settings: {},
  social: {},
  loading: true,
  error: false,
  refresh: () => {},
});

/**
 * Loads the shared settings (site name, hero text, etc.) and social links
 * once at app start so every page can use them instantly.
 */
export function DataProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [social, setSocial] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [s, l] = await Promise.all([api.get('/settings'), api.get('/social-links')]);
      setSettings(s.data.data);
      setSocial(l.data.data);
    } catch {
      setError(true);
      // The site still works without these — components use fallbacks.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DataContext.Provider value={{ settings, social, loading, error, refresh }}>{children}</DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
