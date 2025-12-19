const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require moderator role
router.use(protect, authorize('moderator'));

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// Charity management
router.get('/charities/pending', adminController.getPendingCharities);
router.get('/charities', adminController.getAllCharities);
router.get('/charities/:id', adminController.getCharityDetails);
router.put('/charities/:id/approve', adminController.approveCharity);
router.put('/charities/:id/reject', adminController.rejectCharity);

module.exports = router;
