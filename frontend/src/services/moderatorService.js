import api from './api';

export const moderatorService = {
  // Dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/moderator/dashboard/stats');
    return response.data;
  },

  // Charity management
  getCharitiesForReview: async (params = {}) => {
    const response = await api.get('/moderator/charities', { params });
    return response.data;
  },

  getCharityDetails: async (charityId) => {
    const response = await api.get(`/moderator/charities/${charityId}/details`);
    return response.data;
  },

  reviewCharity: async (charityId, reviewData) => {
    const response = await api.post(`/moderator/charities/${charityId}/review`, reviewData);
    return response.data;
  },

  deleteCharity: async (charityId) => {
    const response = await api.delete(`/moderator/charities/${charityId}`);
    return response.data;
  },
  // Permanent delete (hard delete)
  hardDeleteCharity: async (charityId) => {
    const response = await api.delete(`/moderator/charities/${charityId}`, { params: { hard: true } });
    return response.data;
  },

  // Volunteer management
  getVolunteersForReview: async (params = {}) => {
    const response = await api.get('/moderator/volunteers', { params });
    return response.data;
  },

  getVolunteerDetails: async (volunteerId) => {
    const response = await api.get(`/moderator/volunteers/${volunteerId}/details`);
    return response.data;
  },

  getVolunteerApplications: async (volunteerId) => {
    const response = await api.get(`/moderator/volunteers/${volunteerId}/applications`);
    return response.data;
  },

  reviewVolunteer: async (volunteerId, reviewData) => {
    const response = await api.post(`/moderator/volunteers/${volunteerId}/review`, reviewData);
    return response.data;
  },

  deleteVolunteer: async (volunteerId) => {
    const response = await api.delete(`/moderator/volunteers/${volunteerId}`);
    return response.data;
  },
  // Permanent delete (hard delete)
  hardDeleteVolunteer: async (volunteerId) => {
    const response = await api.delete(`/moderator/volunteers/${volunteerId}`, { params: { hard: true } });
    return response.data;
  },
  // Reactivate accounts
  activateCharity: async (charityId) => {
    const response = await api.put(`/moderator/charities/${charityId}/activate`);
    return response.data;
  },
  activateVolunteer: async (volunteerId) => {
    const response = await api.put(`/moderator/volunteers/${volunteerId}/activate`);
    return response.data;
  },
  // Get charity opportunities for moderator review
  getCharityOpportunities: async (charityId, params = {}) => {
    const response = await api.get(`/moderator/charities/${charityId}/opportunities`, { params });
    return response.data;
  },
  // Volunteer approval
  approveVolunteer: async (volunteerId, data) => {
    const response = await api.put(`/moderator/volunteers/${volunteerId}/approve`, data);
    return response.data;
  },

  rejectVolunteer: async (volunteerId, data) => {
    const response = await api.put(`/moderator/volunteers/${volunteerId}/reject`, data);
    return response.data;
  },
};