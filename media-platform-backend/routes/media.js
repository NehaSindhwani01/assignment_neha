const express = require('express');
const { verifyToken, verifyStreamToken } = require('../middleware/auth');
const {
  addMedia,
  generateStreamUrl,
  streamMedia,
  getAllMedia
} = require('../controllers/mediaController');
const router = express.Router();

// Protected routes (require JWT token)
router.post('/', verifyToken, addMedia);
router.get('/', verifyToken, getAllMedia);
router.get('/:id/stream-url', verifyToken, generateStreamUrl);

// Streaming route - NO verifyToken middleware, uses verifyStreamToken instead
router.get('/:id/stream', verifyStreamToken, streamMedia);

module.exports = router;