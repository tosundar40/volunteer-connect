import api from './api';

export const charityMatchService = {
  // Get suggested matches for charity review
  getSuggestedMatches: async (opportunityId = null) => {
    const params = opportunityId ? { opportunityId } : {};
    const response = await api.get('/charity/matches', { params });
    return response.data;
  },

  // Review a suggested match
  reviewSuggestedMatch: async (applicationId, decision, notes = null) => {
    const response = await api.post(`/charity/matches/${applicationId}/review`, {
      decision,
      notes
    });
    return response.data;
  },

  // Generate new match suggestions
  generateMatches: async (opportunityId, maxMatches = 10) => {
    const response = await api.post(`/charity/opportunities/${opportunityId}/generate-matches`, {
      maxMatches
    });
    return response.data;
  },

  // Get match details
  getMatchDetails: async (applicationId) => {
    const response = await api.get(`/charity/matches/${applicationId}/details`);
    return response.data;
  },

  // Get opportunities needing matches
  getOpportunitiesNeedingMatches: async () => {
    const response = await api.get('/charity/opportunities/needing-matches');
    return response.data;
  },
};