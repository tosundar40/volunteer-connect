const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateUUID, validateOpportunityUUID } = require('../middleware/validation');

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

module.exports = router;
