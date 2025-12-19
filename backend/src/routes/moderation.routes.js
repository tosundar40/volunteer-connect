const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Placeholder for moderation routes
router.get('/pending', protect, authorize('moderator'), (req, res) => {
  res.json({ success: true, message: 'Moderation pending items' });
});

module.exports = router;
