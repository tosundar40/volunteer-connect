const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderator.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');

// Dashboard
router.get('/dashboard/stats', protect, authorize('moderator'), moderatorController.getModeratorDashboardStats);

// Charity management
router.get('/charities', protect, authorize('moderator'), moderatorController.getCharitiesForReview);
router.get('/charities/:id/details', protect, authorize('moderator'), validateUUID, moderatorController.getCharityDetails);
router.get('/charities/:id/opportunities', protect, authorize('moderator'), validateUUID, moderatorController.getCharityOpportunities);
router.post('/charities/:id/review', protect, authorize('moderator'), validateUUID, moderatorController.reviewCharity);
router.delete('/charities/:id', protect, authorize('moderator'), validateUUID, moderatorController.deleteCharity);
router.put('/charities/:id/activate', protect, authorize('moderator'), validateUUID, moderatorController.activateCharity);

// Volunteer management
router.get('/volunteers', protect, authorize('moderator'), moderatorController.getVolunteersForReview);
router.get('/volunteers/:id/details', protect, authorize('moderator'), validateUUID, moderatorController.getVolunteerDetails);
router.get('/volunteers/:id/applications', protect, authorize('moderator'), validateUUID, moderatorController.getVolunteerApplications);
router.post('/volunteers/:id/review', protect, authorize('moderator'), validateUUID, moderatorController.reviewVolunteer);
router.put('/volunteers/:id/approve', protect, authorize('moderator'), validateUUID, moderatorController.approveVolunteer);
router.put('/volunteers/:id/reject', protect, authorize('moderator'), validateUUID, moderatorController.rejectVolunteer);
router.delete('/volunteers/:id', protect, authorize('moderator'), validateUUID, moderatorController.deleteVolunteer);
router.put('/volunteers/:id/activate', protect, authorize('moderator'), validateUUID, moderatorController.activateVolunteer);

module.exports = router;