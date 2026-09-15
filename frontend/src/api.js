import axios from 'axios';

const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/' : 'http://127.0.0.1:8000/api/');
  return url.endsWith('/') ? url : `${url}/`;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Public auth routes must never send a Bearer token — a stale JWT causes
 *  "Given token not valid for any token type" even on AllowAny endpoints. */
const PUBLIC_AUTH_PATHS = [
  'accounts/register/',
  'accounts/login/',
  'accounts/google-login/',
  'token/',
  'token/refresh/',
];

const isPublicAuthRequest = (url = '') => {
  const path = String(url).replace(/^\/+/, '');
  return PUBLIC_AUTH_PATHS.some((p) => path.includes(p));
};

export const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Inject Bearer token to request headers (skip public auth endpoints)
api.interceptors.request.use(
  (config) => {
    if (isPublicAuthRequest(config.url)) {
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
      return config;
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.response?.data?.error || '';

    // Never attempt refresh loops on public auth calls
    if (isPublicAuthRequest(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch {
          clearAuthStorage();
        }
      } else if (
        typeof detail === 'string' &&
        detail.toLowerCase().includes('token')
      ) {
        clearAuthStorage();
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (username, password) => {
  clearAuthStorage();
  const response = await api.post('accounts/login/', { username, password });
  const { access, refresh, user } = response.data;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

export const googleLoginUser = async (googleData) => {
  // Keep any existing session only for phone-complete flows that already
  // returned requires_phone; otherwise start clean so stale JWTs cannot break signup.
  if (!googleData?.phone) {
    clearAuthStorage();
  }
  const response = await api.post('accounts/google-login/', googleData);
  if (response.data?.requires_phone) {
    return response.data;
  }
  const { access, refresh, user } = response.data;
  if (access && refresh && user) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
  }
  return response.data;
};

export const registerUser = async (registrationData) => {
  clearAuthStorage();
  return api.post('accounts/register/', registrationData);
};

export const updateProfile = async (profileData) => {
  const response = await api.put('accounts/profile/', profileData);
  return response.data;
};

export const logout = () => {
  clearAuthStorage();
  try {
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
  window.location.href = '/';
};

export const getUserProfile = () => {
  try {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (!user || !token) return null;
    return JSON.parse(user);
  } catch {
    clearAuthStorage();
    return null;
  }
};

export default api;
