const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');

// Public routes for authenticated users (volunteers and charities)
router.post('/', protect, reportController.createReport);
router.get('/my-reports', protect, reportController.getMyReports);
router.get('/stats', protect, authorize('moderator', 'admin'), reportController.getReportStats);
router.get('/:id', protect, validateUUID, reportController.getReportById);

// Moderator/Admin only routes
router.get('/', protect, authorize('moderator', 'admin'), reportController.getAllReports);
router.put('/:id/status', protect, authorize('moderator', 'admin'), validateUUID, reportController.updateReportStatus);
router.delete('/:id', protect, authorize('moderator', 'admin'), validateUUID, reportController.deleteReport);
router.get('/entity/:entityType/:entityId', protect, authorize('moderator', 'admin'), reportController.getReportsForEntity);

module.exports = router;
