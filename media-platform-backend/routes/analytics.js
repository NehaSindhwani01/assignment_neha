const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  logView,
  getAnalytics,
  getAllMediaAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();

/**
 * @route   POST /api/analytics/media/:id/view
 * @desc    Log a media view (IP + timestamp)
 * @access  Public (or Protected if you want)
 */
router.post('/media/:id/view', logView);

/**
 * @route   GET /api/analytics/media/:id/analytics
 * @desc    Get analytics for specific media
 * @access  Private (Admin only)
 */
router.get('/media/:id/analytics', verifyToken, getAnalytics);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get analytics dashboard for all admin media
 * @access  Private (Admin only)
 */
router.get('/dashboard', verifyToken, getAllMediaAnalytics);

module.exports = router;