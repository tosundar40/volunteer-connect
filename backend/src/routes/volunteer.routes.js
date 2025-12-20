const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteer.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateVolunteer, validateUUID } = require('../middleware/validation');

router.get('/', protect, authorize('charity', 'moderator'), volunteerController.getVolunteers);
router.get('/me', protect, authorize('volunteer'), volunteerController.getMyVolunteerProfile);
router.get('/:id', protect, validateUUID, volunteerController.getVolunteer);
router.get('/:id/stats', protect, validateUUID, volunteerController.getVolunteerStats);
router.get('/:id/average-rating', validateUUID, volunteerController.getVolunteerAverageRating);
router.get('/:id/recommendations', protect, authorize('volunteer', 'moderator'), validateUUID, volunteerController.getRecommendations);

router.post(
  '/',
  protect,
  authorize('volunteer'),
  validateVolunteer,
  volunteerController.createOrUpdateVolunteer
);

router.put(
  '/:id',
  protect,
  authorize('volunteer', 'moderator'),
  validateUUID,
  volunteerController.updateVolunteer
);

module.exports = router;
