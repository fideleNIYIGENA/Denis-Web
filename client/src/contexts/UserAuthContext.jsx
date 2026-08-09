import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import userApi from '../api/userClient.js';

/**
 * Centralized public-user authentication state.
 *
 * Authentication (email/password sessions) is handled by Supabase Auth and
 * persisted by the Supabase client, so the session survives page refreshes.
 * The user's profile + subscription status are fetched from the Express API
 * (the browser never talks to the database directly).
 *
 * Subscription status is separate from authentication: a user can be logged
 * in but have no active subscription.
 */
const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(
    isSupabaseConfigured ? '' : 'Public accounts are not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  );

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setCurrentUser(null);
      return null;
    }
    try {
      const res = await userApi.get('/users/profile');
      const data = res.data.data;
      setCurrentUser(data);
      return data;
    } catch (err) {
      if (err.response?.status === 401) {
        setCurrentUser(null);
        return null;
      }
      // Network / server errors keep the session but no profile data.
      setCurrentUser(null);
      return null;
    }
  }, [session]);

  // Restore the persisted session on mount and listen for auth changes.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  // Refresh the profile whenever the session changes.
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const register = useCallback(async (email, password) => {
    if (!supabase) throw new Error(configError || 'Authentication is not configured.');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, [configError]);

  const login = useCallback(async (email, password) => {
    if (!supabase) throw new Error(configError || 'Authentication is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, [configError]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabase) throw new Error(configError || 'Authentication is not configured.');
    const redirectTo = `${import.meta.env.VITE_SITE_URL || window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }, [configError]);

  const changePassword = useCallback(async (newPassword) => {
    if (!supabase) throw new Error(configError || 'Authentication is not configured.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, [configError]);

  const isAuthenticated = !!session?.user;
  const subscription = currentUser?.subscription || { status: 'inactive' };
  const isSubscribed = subscription.status === 'active';

  return (
    <UserAuthContext.Provider
      value={{
        session,
        currentUser,
        profile: currentUser?.profile || null,
        subscription,
        loading,
        configError,
        isAuthenticated,
        isSubscribed,
        refreshProfile,
        register,
        login,
        logout,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => useContext(UserAuthContext);
