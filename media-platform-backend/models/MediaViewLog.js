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
  user_agent: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  token_used: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
mediaViewLogSchema.index({ media_id: 1, timestamp: -1 });
mediaViewLogSchema.index({ media_id: 1, viewed_by_ip: 1 });
mediaViewLogSchema.index({ timestamp: 1 });

// Virtual for date (without time)
mediaViewLogSchema.virtual('view_date').get(function() {
  return this.timestamp.toISOString().split('T')[0];
});

module.exports = mongoose.models.MediaViewLog || mongoose.model('MediaViewLog', mediaViewLogSchema);