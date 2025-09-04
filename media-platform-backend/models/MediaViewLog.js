const mongoose = require('mongoose');

const mediaViewLogSchema = new mongoose.Schema({
  media_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaAsset',
    required: true
  },
  viewed_by_ip: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  token_used: {
    type: String,
    required: true
  }
});

// Compound index for analytics
mediaViewLogSchema.index({ media_id: 1, timestamp: -1 });

module.exports = mongoose.model('MediaViewLog', mediaViewLogSchema);