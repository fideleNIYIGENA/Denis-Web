import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const TOKEN_KEY = 'dn_token';
const ADMIN_KEY = 'dn_admin';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_KEY));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Re-validate the stored token on mount / token change.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    api
      .get('/auth/me')
      .then((res) => {
        if (!active) return;
        setAdmin(res.data.admin);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(res.data.admin));
      })
      .catch(() => {
        if (!active) return;
        setToken(null);
        setAdmin(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(res.data.admin));
    setToken(res.data.token);
    setAdmin(res.data.admin);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, admin, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
