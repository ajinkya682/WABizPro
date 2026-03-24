import { create } from 'zustand';
import api from '../services/api';

const useContactStore = create((set, get) => ({
  contacts: [], total: 0, isLoading: false, error: null,

  fetchContacts: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/contacts', { params });
      set({ contacts: res.data.contacts, total: res.data.total, isLoading: false });
    } catch (err) { set({ error: err.response?.data?.message, isLoading: false }); }
  },

  createContact: async (data) => {
    try {
      const res = await api.post('/contacts', data);
      set((s) => ({ contacts: [res.data.contact, ...s.contacts], total: s.total + 1 }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.message || 'Failed to create contact' }; }
  },

  updateContact: async (id, data) => {
    try {
      const res = await api.put(`/contacts/${id}`, data);
      set((s) => ({ contacts: s.contacts.map(c => c._id === id ? res.data.contact : c) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.message }; }
  },

  deleteContact: async (id) => {
    try {
      await api.delete(`/contacts/${id}`);
      set((s) => ({ contacts: s.contacts.filter(c => c._id !== id), total: s.total - 1 }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.message }; }
  },
}));

export default useContactStore;
