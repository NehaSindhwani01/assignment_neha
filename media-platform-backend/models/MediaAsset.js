const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'audio'],
    lowercase: true
  },
  file_url: {
    type: String,
    required: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  view_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
mediaAssetSchema.index({ created_by: 1, created_at: -1 });

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);