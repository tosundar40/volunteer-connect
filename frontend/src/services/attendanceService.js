import api from './api';

const attendanceService = {
  // Get volunteers for attendance tracking
  getVolunteersForAttendance: async (opportunityId) => {
    const response = await api.get(`/attendance/opportunity/${opportunityId}/volunteers`);
    return response.data;
  },

  // Record or update attendance
  recordAttendance: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  // Get attendance records for an opportunity
  getOpportunityAttendance: async (opportunityId) => {
    const response = await api.get(`/attendance/opportunity/${opportunityId}`);
    return response.data;
  },

  // Get volunteer's own attendance history
  getMyAttendanceHistory: async (params = {}) => {
    const response = await api.get('/attendance/my-history', { params });
    return response.data;
  },

  // Submit volunteer feedback
  submitVolunteerFeedback: async (attendanceId, feedbackData) => {
    const response = await api.put(`/attendance/${attendanceId}/volunteer-feedback`, feedbackData);
    return response.data;
  },

  // Delete attendance record
  deleteAttendance: async (attendanceId) => {
    const response = await api.delete(`/attendance/${attendanceId}`);
    return response.data;
  }
};

export default attendanceService;