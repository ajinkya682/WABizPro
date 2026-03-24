import { create } from 'zustand';
import api from '../services/api';

const getStoredUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  login: async (email, password, rememberMe) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (rememberMe) localStorage.setItem('refreshToken', res.data.refreshToken);
      set({ user: res.data.user, token: res.data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, token: null, isAuthenticated: false });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset email';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
