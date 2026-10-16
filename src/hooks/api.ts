import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL ?? '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
