import axios from 'axios';
import { supabase } from '../lib/supabase.js';

/**
 * Axios instance for the public-user API. Automatically attaches the signed-in
 * Supabase user's access token so the backend can verify the identity from the
 * JWT (the backend never trusts a client-supplied user id).
 */
const userApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

userApi.interceptors.request.use(async (config) => {
  if (!supabase) return config;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // no session — request proceeds unauthenticated
  }
  return config;
});

export default userApi;
