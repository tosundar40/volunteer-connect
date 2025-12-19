const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunity.controller');
const { protect, authorize, requireCompleteProfile } = require('../middleware/auth');
const { validateOpportunity, validateUUID } = require('../middleware/validation');

router.get('/', opportunityController.getOpportunities);
router.get('/charity/my-opportunities', protect, authorize('charity'), opportunityController.getMyOpportunities);
router.get('/:id', validateUUID, opportunityController.getOpportunity);
router.get('/:id/matched-volunteers', protect, authorize('charity'), validateUUID, opportunityController.getMatchedVolunteers);

router.post(
  '/',
  protect,
  authorize('charity'),
  requireCompleteProfile,
  validateOpportunity,
  opportunityController.createOpportunity
);

router.put(
  '/:id',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  opportunityController.updateOpportunity
);

router.put(
  '/:id/close',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  opportunityController.closeOpportunity
);

router.delete(
  '/:id',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  opportunityController.deleteOpportunity
);

router.get(
  '/:id/matches',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  opportunityController.getMatchedVolunteers
);

router.get(
  '/:id/applications',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  opportunityController.getOpportunityApplications
);

module.exports = router;
