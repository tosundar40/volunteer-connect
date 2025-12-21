import api from './api';

/**
 * Create a new report
 * @param {Object} reportData - The report data
 * @param {string} reportData.reportedEntityType - Type of entity being reported (user, charity, opportunity, comment)
 * @param {string} reportData.reportedEntityId - ID of the entity being reported
 * @param {string} reportData.reason - Reason for the report
 * @param {string} reportData.description - Detailed description of the issue
 * @returns {Promise} Promise with report data
 */
export const createReport = async (reportData) => {
  const response = await api.post('/reports', reportData);
  return response.data;
};

/**
 * Get all reports submitted by the current user
 * @returns {Promise} Promise with user's reports
 */
export const getMyReports = async () => {
  const response = await api.get('/reports/my-reports');
  return response.data;
};

/**
 * Get a specific report by ID
 * @param {string} reportId - The report ID
 * @returns {Promise} Promise with report data
 */
export const getReportById = async (reportId) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data;
};

/**
 * Get all reports (Moderator only)
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status
 * @param {string} filters.reportedEntityType - Filter by entity type
 * @param {string} filters.reason - Filter by reason
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @returns {Promise} Promise with all reports
 */
export const getAllReports = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.reportedEntityType) params.append('reportedEntityType', filters.reportedEntityType);
  if (filters.reason) params.append('reason', filters.reason);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  const response = await api.get(`/reports?${params.toString()}`);
  return response.data;
};

/**
 * Update report status (Moderator only)
 * @param {string} reportId - The report ID
 * @param {Object} updateData - Update data
 * @param {string} updateData.status - New status
 * @param {string} updateData.resolution - Resolution notes
 * @param {string} updateData.actionTaken - Action taken
 * @returns {Promise} Promise with updated report
 */
export const updateReportStatus = async (reportId, updateData) => {
  const response = await api.put(`/reports/${reportId}/status`, updateData);
  return response.data;
};

/**
 * Delete a report (Moderator/Admin only)
 * @param {string} reportId - The report ID
 * @returns {Promise} Promise with success message
 */
export const deleteReport = async (reportId) => {
  const response = await api.delete(`/reports/${reportId}`);
  return response.data;
};

/**
 * Get report statistics (Moderator only)
 * @returns {Promise} Promise with report stats
 */
export const getReportStats = async () => {
  const response = await api.get('/reports/stats');
  return response.data;
};

/**
 * Get reports for a specific entity (Moderator only)
 * @param {string} entityType - Type of entity
 * @param {string} entityId - ID of entity
 * @returns {Promise} Promise with entity reports
 */
export const getReportsForEntity = async (entityType, entityId) => {
  const response = await api.get(`/reports/entity/${entityType}/${entityId}`);
  return response.data;
};

export default {
  createReport,
  getMyReports,
  getReportById,
  getAllReports,
  updateReportStatus,
  deleteReport,
  getReportStats,
  getReportsForEntity
};
