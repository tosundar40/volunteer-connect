import api from './api';

export const applicationService = {
  getApplications: async (params = {}) => {
    const response = await api.get('/applications', { params });
    return response.data;
  },

  getMyApplications: async () => {
    const response = await api.get('/applications');
    return response.data;
  },

  getApplication: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  // Alias used by frontend pages
  getApplicationById: async (id) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  createApplication: async (applicationData) => {
    const response = await api.post('/applications', applicationData);
    return response.data;
  },

  updateApplicationStatus: async (id, statusData) => {
    const response = await api.put(`/applications/${id}`, statusData);
    return response.data;
  },

  withdrawApplication: async (id, reason) => {
    const response = await api.put(`/applications/${id}/withdraw`, { withdrawnReason: reason });
    return response.data;
  },

  // Volunteer provides additional information
  provideAdditionalInfo: async (id, additionalInfo) => {
    const response = await api.post(`/applications/${id}/provide-info`, { additionalInfo });
    return response.data;
  },

  // Volunteer confirms participation
  confirmParticipation: async (id, confirmationData) => {
    const response = await api.post(`/applications/${id}/confirm`, confirmationData);
    return response.data;
  },

  // Charity requests additional information
  requestAdditionalInfo: async (id, infoRequested, message) => {
    const response = await api.post(`/applications/${id}/request-info`, { infoRequested, message });
    return response.data;
  },

  // Charity completes vetting
  completeVetting: async (id, vettingData) => {
    const response = await api.post(`/applications/${id}/complete-vetting`, vettingData);
    return response.data;
  },

  // Get volunteer profile for charity review
  getVolunteerProfile: async (id) => {
    const response = await api.get(`/applications/${id}/volunteer-profile`);
    return response.data;
  },

  // Moderator endpoints
  getApplicationsForModeratorReview: async () => {
    const response = await api.get('/applications/moderator/review');
    return response.data;
  },

  moderatorReviewApplication: async (id, reviewData) => {
    const response = await api.post(`/applications/${id}/moderator-review`, reviewData);
    return response.data;
  },
};

export default applicationService;
