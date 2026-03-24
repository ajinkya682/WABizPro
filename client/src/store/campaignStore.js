import { create } from 'zustand';
import api from '../services/api';

const useCampaignStore = create((set) => ({
  campaigns: [], isLoading: false, error: null,

  fetchCampaigns: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/campaigns', { params });
      set({ campaigns: res.data.campaigns, isLoading: false });
    } catch (err) { set({ error: err.response?.data?.message, isLoading: false }); }
  },

  createCampaign: async (data) => {
    try {
      const payload = {
        ...data,
        segmentId: data.segmentId || undefined,
        scheduledAt: data.scheduledAt || undefined,
        contactIds: Array.isArray(data.contactIds) && data.contactIds.length > 0 ? data.contactIds : undefined,
      };
      const res = await api.post('/campaigns', payload);
      set((s) => ({ campaigns: [res.data.campaign, ...s.campaigns] }));
      return { success: true, campaign: res.data.campaign };
    } catch (err) { return { success: false, message: err.response?.data?.message }; }
  },

  updateCampaign: async (id, data) => {
    try {
      const res = await api.put(`/campaigns/${id}`, data);
      set((s) => ({ campaigns: s.campaigns.map(c => c._id === id ? res.data.campaign : c) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.message }; }
  },

  deleteCampaign: async (id) => {
    try {
      await api.delete(`/campaigns/${id}`);
      set((s) => ({ campaigns: s.campaigns.filter(c => c._id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.message }; }
  },

  sendCampaign: async (id) => {
    try {
      const res = await api.post(`/campaigns/${id}/send`);
      set((s) => ({
        campaigns: s.campaigns.map((c) => (c._id === id ? { ...c, ...res.data.campaign } : c)),
      }));
      return { success: true, message: res.data.message };
    } catch (err) { return { success: false, message: err.response?.data?.message }; }
  },
}));

export default useCampaignStore;
