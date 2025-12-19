const { Notification } = require('../models');

/**
 * Create a notification for a user
 * @param {string} userId - User UUID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 * @param {string} actionUrl - URL for notification action
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (userId, type, title, message, data = {}, actionUrl = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      actionUrl
    });

    // Emit socket event if io is available
    const io = global.io || require('../server').io;
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify charity about new application
 */
exports.notifyCharityNewApplication = async (charityId, applicationId) => {
  const charity = await require('../models').Charity.findByPk(charityId);
  if (!charity) return;

  await createNotification(
    charity.userId,
    'application_received',
    'New Volunteer Application',
    'You have received a new volunteer application for your opportunity.',
    { applicationId },
    `/applications/${applicationId}`
  );
};

/**
 * Notify volunteer about application status update
 */
exports.notifyVolunteerApplicationUpdate = async (volunteerId, applicationId, status) => {
  const volunteer = await require('../models').Volunteer.findByPk(volunteerId);
  if (!volunteer) return;

  const titles = {
    approved: 'Application Approved',
    rejected: 'Application Status Update',
    confirmed: 'Volunteering Confirmed',
    under_review: 'Application Under Review'
  };

  const messages = {
    approved: 'Your application has been approved!',
    rejected: 'Your application status has been updated.',
    confirmed: 'You have been confirmed for this volunteering opportunity.',
    under_review: 'Your application is currently under review.'
  };

  await createNotification(
    volunteer.userId,
    `application_${status}`,
    titles[status] || 'Application Update',
    messages[status] || 'Your application status has been updated.',
    { applicationId, status },
    `/applications/${applicationId}`
  );
};

/**
 * Notify volunteer about new opportunity match
 */
exports.notifyVolunteerNewMatch = async (volunteerId, opportunityId) => {
  const volunteer = await require('../models').Volunteer.findByPk(volunteerId);
  if (!volunteer) return;

  await createNotification(
    volunteer.userId,
    'new_opportunity_match',
    'New Opportunity Match',
    'We found a new volunteering opportunity that matches your profile!',
    { opportunityId },
    `/opportunities/${opportunityId}`
  );
};

/**
 * Notify volunteer about additional information request
 */
exports.notifyVolunteerAdditionalInfoRequest = async (volunteerId, applicationId, message) => {
  await createNotification(
    volunteerId,
    'additional_info_requested',
    'Additional Information Requested',
    `A charity has requested additional information for your application: ${message}`,
    { applicationId },
    `/applications/${applicationId}/provide-info`
  );
};

/**
 * Notify charity that additional information has been provided
 */
exports.notifyCharityAdditionalInfoProvided = async (charityUserId, applicationId) => {
  await createNotification(
    charityUserId,
    'additional_info_provided',
    'Additional Information Received',
    'A volunteer has provided the additional information you requested.',
    { applicationId },
    `/applications/${applicationId}`
  );
};

/**
 * Notify volunteer about background check requirement
 */
exports.notifyVolunteerBackgroundCheckRequired = async (volunteerId, applicationId) => {
  const volunteer = await require('../models').Volunteer.findByPk(volunteerId);
  if (!volunteer) return;

  await createNotification(
    volunteer.userId,
    'background_check_required',
    'Background Check Required',
    'A background check is required to proceed with your application.',
    { applicationId },
    `/volunteer/background-check/${applicationId}`
  );
};

/**
 * Notify moderators about a flagged application
 */
exports.notifyModeratorsApplicationFlagged = async (applicationId, reason) => {
  const { User } = require('../models');
  const moderators = await User.findAll({ where: { role: 'moderator' } });
  
  for (const moderator of moderators) {
    await createNotification(
      moderator.id,
      'application_flagged',
      'Application Flagged for Review',
      `An application has been flagged for moderation review. Reason: ${reason}`,
      { applicationId, reason },
      `/moderator/applications/${applicationId}`
    );
  }
};

/**
 * Notify charity about moderator review completion
 */
exports.notifyCharityModeratorReview = async (charityUserId, applicationId, reviewStatus) => {
  const statusMessages = {
    approved: 'The moderator review has been completed and approved.',
    rejected: 'The moderator review has been completed and the application has been rejected.',
    escalated: 'The application has been escalated for further review.'
  };

  await createNotification(
    charityUserId,
    'moderator_review_complete',
    'Moderator Review Complete',
    statusMessages[reviewStatus] || 'The moderator review has been completed.',
    { applicationId, reviewStatus },
    `/applications/${applicationId}`
  );
};

/**
 * Notify charity about volunteer match suggestions
 */
exports.notifyCharityVolunteerMatch = async (charityUserId, opportunityId, volunteerId) => {
  await createNotification(
    charityUserId,
    'volunteer_match_suggestion',
    'New Volunteer Match Suggestion',
    'We found a volunteer who might be a good fit for your opportunity.',
    { opportunityId, volunteerId },
    `/charity/matches/${opportunityId}`
  );
};

/**
 * Notify charity about volunteer confirming participation
 */
exports.notifyCharityVolunteerConfirmed = async (charityUserId, applicationId, committedHours) => {
  await createNotification(
    charityUserId,
    'volunteer_confirmed',
    'Volunteer Confirmed Participation',
    `A volunteer has confirmed their participation and committed ${committedHours} hours to your opportunity.`,
    { applicationId, committedHours },
    `/applications/${applicationId}`
  );
};

module.exports = {
  createNotification,
  notifyCharityNewApplication: exports.notifyCharityNewApplication,
  notifyVolunteerApplicationUpdate: exports.notifyVolunteerApplicationUpdate,
  notifyVolunteerNewMatch: exports.notifyVolunteerNewMatch,
  notifyVolunteerAdditionalInfoRequest: exports.notifyVolunteerAdditionalInfoRequest,
  notifyCharityAdditionalInfoProvided: exports.notifyCharityAdditionalInfoProvided,
  notifyVolunteerBackgroundCheckRequired: exports.notifyVolunteerBackgroundCheckRequired,
  notifyModeratorsApplicationFlagged: exports.notifyModeratorsApplicationFlagged,
  notifyCharityModeratorReview: exports.notifyCharityModeratorReview,
  notifyCharityVolunteerMatch: exports.notifyCharityVolunteerMatch,
  notifyCharityVolunteerConfirmed: exports.notifyCharityVolunteerConfirmed
};
