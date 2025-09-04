const MediaAsset = require('../models/MediaAsset');
const MediaViewLog = require('../models/MediaViewLog');
const { generateStreamToken } = require('../middleware/auth');

// Add media metadata
exports.addMedia = async (req, res) => {
  try {
    const { title, type, file_url } = req.body;

    const mediaAsset = new MediaAsset({
      title,
      type,
      file_url,
      created_by: req.user._id
    });

    await mediaAsset.save();

    // Populate created_by info
    await mediaAsset.populate('created_by', 'email');

    res.status(201).json({
      success: true,
      message: 'Media asset created successfully.',
      data: {
        media: mediaAsset
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating media asset.',
      error: error.message
    });
  }
};

// Generate secure streaming URL
exports.generateStreamUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userIp = req.ip || req.connection.remoteAddress;

    // Check if media exists
    const media = await MediaAsset.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found.'
      });
    }

    // Generate short-lived streaming token
    const streamToken = generateStreamToken(id, userIp);

    // Construct secure streaming URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const streamUrl = `${baseUrl}/api/media/${id}/stream?token=${streamToken}`;

    res.json({
      success: true,
      message: 'Stream URL generated successfully.',
      data: {
        stream_url: streamUrl,
        expires_in: '10 minutes'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating stream URL.',
      error: error.message
    });
  }
};

// Stream media (protected by stream token)
exports.streamMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaId, userIp } = req.streamData;
    const token = req.query.token; // Get the token from query params

    // Verify media ID matches
    if (id !== mediaId) {
      return res.status(400).json({
        success: false,
        message: 'Media ID mismatch.'
      });
    }

    // Check if media exists
    const media = await MediaAsset.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found.'
      });
    }

    // Log the view with the token_used field
    const viewLog = new MediaViewLog({
      media_id: id,
      viewed_by_ip: userIp,
      token_used: token // Add the token to the log
    });

    await viewLog.save();

    // In a real implementation, you would serve the media file here
    // For now, we'll return the actual file URL
    res.json({
      success: true,
      message: 'Media streaming access granted.',
      data: {
        media: {
          title: media.title,
          type: media.type,
          file_url: media.file_url,
          actual_stream_url: `${media.file_url}?token=${token}`,
          view_log_id: viewLog._id // Return the log ID for reference
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error streaming media.',
      error: error.message
    });
  }
};

// Get all media (for admin)
exports.getAllMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const media = await MediaAsset.find({ created_by: req.user._id })
      .populate('created_by', 'email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MediaAsset.countDocuments({ created_by: req.user._id });

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media.',
      error: error.message
    });
  }
};