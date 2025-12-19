const express = require('express');
const router = express.Router();

// Placeholder for user routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'User routes' });
});

module.exports = router;
