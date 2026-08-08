import axios from 'axios';
import { useStore } from './store';

export const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Intercept 401s to logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
