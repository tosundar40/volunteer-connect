const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateUUID, validateOpportunityUUID, validateCharityUUID, validateVolunteerUUID } = require('../middleware/validation');

// Get volunteers for attendance tracking
router.get(
  '/opportunity/:opportunityId/volunteers',
  protect,
  authorize('charity'),
  validateOpportunityUUID,
  attendanceController.getVolunteersForAttendance
);

// Record or update attendance
router.post(
  '/',
  protect,
  authorize('charity'),
  attendanceController.recordAttendance
);

// Get attendance records for an opportunity
router.get(
  '/opportunity/:opportunityId',
  protect,
  authorize('charity'),
  validateOpportunityUUID,
  attendanceController.getOpportunityAttendance
);

// Get volunteer's own attendance history
router.get(
  '/my-history',
  protect,
  authorize('volunteer'),
  attendanceController.getMyAttendanceHistory
);

// Submit volunteer feedback
router.put(
  '/:id/volunteer-feedback',
  protect,
  authorize('volunteer'),
  validateUUID,
  attendanceController.submitVolunteerFeedback
);

// Delete attendance record
router.delete(
  '/:id',
  protect,
  authorize('charity'),
  validateUUID,
  attendanceController.deleteAttendance
);

// Get average charity rating for a volunteer
router.get(
  '/volunteer/:volunteerId/average-rating',
  protect,
  validateVolunteerUUID,
  attendanceController.getVolunteerAverageRating
);

// Get average volunteer rating for an opportunity
router.get(
  '/opportunity/:opportunityId/average-rating',
  protect,
  validateOpportunityUUID,
  attendanceController.getOpportunityAverageRating
);

// Get average charity rating for all opportunities by a charity
router.get(
  '/charity/:charityId/average-rating',
  validateCharityUUID,
  attendanceController.getCharityAverageRating
);

module.exports = router;
