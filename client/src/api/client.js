import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Let Axios set the Content-Type for each request. In particular, file uploads
// need a multipart/form-data boundary that the browser generates automatically.

// Attach the Bearer token to every request when present, and give file
// uploads (multipart FormData) a much longer timeout — uploading a large
// MP3 to storage can take well over the default 10s.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) config.timeout = 180000;
  return config;
});

// On a 401 clear the session so the admin is redirected to login —
// but never clear it for a failed login attempt itself.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('dn_token');
      localStorage.removeItem('dn_admin');
    }
    return Promise.reject(err);
  }
);

export default api;
