import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  let token: string | null = null;

  try {
    const { store } = require('@/store');
    token = (store.getState() as { auth: { token: string | null } }).auth.token;
  } catch {
    // store not available (e.g. during SSR)
  }

  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const { store } = require('@/store');
        const { logout } = require('@/store/slices/auth.slice');
        store.dispatch(logout());
      } catch {
        localStorage.removeItem('token');
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
