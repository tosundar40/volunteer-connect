import api from './api';

const volunteerService = {
  // Get volunteer profile by user ID
  getProfile: async (userId) => {
    const response = await api.get(`/volunteers/${userId}`);
    return response.data;
  },

  // Get current user's volunteer profile
  getMyProfile: async () => {
    const response = await api.get('/volunteers/me');
    return response.data;
  },

  // Create or update volunteer profile
  createOrUpdateProfile: async (profileData) => {
    const response = await api.post('/volunteers', profileData);
    return response.data;
  },

  // Update volunteer profile by ID
  updateProfile: async (volunteerId, profileData) => {
    const response = await api.put(`/volunteers/${volunteerId}`, profileData);
    return response.data;
  },

  // Get volunteer statistics
  getStats: async (volunteerId) => {
    const response = await api.get(`/volunteers/${volunteerId}/stats`);
    return response.data;
  },

  // Get recommended opportunities for volunteer
  getRecommendations: async (volunteerId) => {
    const response = await api.get(`/volunteers/${volunteerId}/recommendations`);
    return response.data;
  },

  // Get all volunteers (for charity/moderator)
  getAllVolunteers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.skills) queryParams.append('skills', filters.skills);
    if (filters.interests) queryParams.append('interests', filters.interests);
    if (filters.city) queryParams.append('city', filters.city);

    const response = await api.get(`/volunteers?${queryParams.toString()}`);
    return response.data;
  }
};

export default volunteerService;
