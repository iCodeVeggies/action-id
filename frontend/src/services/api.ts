import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// In Docker, use relative URL; otherwise use env var or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only redirect on 401 for authentication failures, not for verification failures
    // Check if this is a verification endpoint - don't redirect for those
    const url = error.config?.url || '';
    const isVerificationEndpoint = url.includes('/verify-biometric') || url.includes('/enroll/complete');
    
    if (error.response?.status === 401 && !isVerificationEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
