const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { protect, authorize, requireCompleteProfile } = require('../middleware/auth');
const { validateApplication, validateUUID } = require('../middleware/validation');

router.get('/', protect, applicationController.getApplications);
router.get('/moderator/review', protect, authorize('moderator'), applicationController.getApplicationsForModeratorReview);
router.get('/:id', protect, validateUUID, applicationController.getApplication);
router.get('/:id/volunteer-profile', protect, authorize('charity'), validateUUID, applicationController.getVolunteerProfileForReview);

router.post(
  '/',
  protect,
  authorize('volunteer'),
  requireCompleteProfile,
  validateApplication,
  applicationController.createApplication
);

router.post(
  '/:id/request-info',
  protect,
  authorize('charity'),
  validateUUID,
  applicationController.requestAdditionalInfo
);

router.post(
  '/:id/provide-info',
  protect,
  authorize('volunteer'),
  validateUUID,
  applicationController.provideAdditionalInfo
);

router.post(
  '/:id/confirm',
  protect,
  authorize('volunteer'),
  validateUUID,
  applicationController.confirmParticipation
);

router.post(
  '/:id/complete-vetting',
  protect,
  authorize('charity'),
  validateUUID,
  applicationController.completeVetting
);

router.post(
  '/:id/moderator-review',
  protect,
  authorize('moderator'),
  validateUUID,
  applicationController.moderatorReviewApplication
);

router.put(
  '/:id',
  protect,
  authorize('charity', 'moderator'),
  validateUUID,
  applicationController.updateApplicationStatus
);

router.put(
  '/:id/withdraw',
  protect,
  authorize('volunteer'),
  validateUUID,
  applicationController.withdrawApplication
);

module.exports = router;
