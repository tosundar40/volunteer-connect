import api from './api';

export const opportunityService = {
  getOpportunities: async (params = {}) => {
    const response = await api.get('/opportunities', { params });
    return response.data;
  },

  getOpportunity: async (id) => {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
  },

  createOpportunity: async (opportunityData) => {
    const response = await api.post('/opportunities', opportunityData);
    return response.data;
  },

  updateOpportunity: async (id, opportunityData) => {
    const response = await api.put(`/opportunities/${id}`, opportunityData);
    return response.data;
  },

  deleteOpportunity: async (id) => {
    const response = await api.delete(`/opportunities/${id}`);
    return response.data;
  },

  closeOpportunity: async (id, data = {}) => {
    const response = await api.put(`/opportunities/${id}/close`, data);
    return response.data;
  },

  getMatchedVolunteers: async (id) => {
    const response = await api.get(`/opportunities/${id}/matches`);
    return response.data;
  },

  getOpportunityApplications: async (id) => {
    const response = await api.get(`/opportunities/${id}/applications`);
    return response.data;
  },
};
