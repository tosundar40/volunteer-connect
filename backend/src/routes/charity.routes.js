const express = require('express');
const router = express.Router();
const charityController = require('../controllers/charity.controller');
const charityMatchController = require('../controllers/charity.match.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateCharity, validateUUID } = require('../middleware/validation');

router.get('/', charityController.getCharities);
router.get('/profile', protect, authorize('charity'), charityController.getCharityProfile);
router.get('/stats', protect, authorize('charity'), charityController.getCurrentCharityStats);

// Match management routes
router.get('/matches', protect, authorize('charity'), charityMatchController.getSuggestedMatches);
router.get('/opportunities/needing-matches', protect, authorize('charity'), charityMatchController.getOpportunitiesNeedingMatches);
router.get('/matches/:applicationId/details', protect, authorize('charity'), validateUUID, charityMatchController.getMatchDetails);
router.post('/matches/:applicationId/review', protect, authorize('charity'), validateUUID, charityMatchController.reviewSuggestedMatch);
router.post('/opportunities/:opportunityId/generate-matches', protect, authorize('charity'), validateUUID, charityMatchController.generateMatches);

router.put(
  '/profile', 
  protect, 
  authorize('charity'), 
  charityController.uploadProfileImages,
  charityController.updateCharityProfile
);
router.get('/:id', validateUUID, charityController.getCharity);
router.get('/:id/profile', validateUUID, charityController.getPublicCharityProfile);
router.get('/:id/stats', validateUUID, charityController.getCharityStats);
router.get('/:id/average-rating', validateUUID, charityController.getCharityAverageRating);

router.post(
  '/',
  protect,
  authorize('charity'),
  validateCharity,
  charityController.createOrUpdateCharity
);

router.put(
  '/:id',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  charityController.updateCharity
);

router.delete(
  '/:id',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  charityController.deleteCharity
);

module.exports = router;
