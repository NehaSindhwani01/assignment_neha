const MediaAsset = require('../models/MediaAsset');
const MediaViewLog = require('../models/MediaViewLog');

// Log a media view
exports.logView = async (req, res) => {
  try {
    const { id } = req.params;
    const userIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    // Check if media exists
    const media = await MediaAsset.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found.'
      });
    }

    // Log the view
    const viewLog = new MediaViewLog({
      media_id: id,
      viewed_by_ip: userIp,
      user_agent: userAgent,
      token_used: req.query.token || 'direct' // Track if viewed via token
    });

    await viewLog.save();

    // Update media view count (optional optimization)
    await MediaAsset.findByIdAndUpdate(id, { 
      $inc: { view_count: 1 } 
    });

    res.status(201).json({
      success: true,
      message: 'View logged successfully.',
      data: {
        view_id: viewLog._id,
        media_id: id,
        viewed_at: viewLog.timestamp
      }
    });

  } catch (error) {
    console.error('Error logging view:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging media view.',
      error: error.message
    });
  }
};

// Get media analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query; // Optional: days to analyze

    // Check if media exists
    const media = await MediaAsset.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found.'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all views for this media
    const views = await MediaViewLog.find({
      media_id: id,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    // Calculate analytics
    const total_views = views.length;
    
    // Get unique IPs
    const uniqueIps = new Set(views.map(view => view.viewed_by_ip));
    const unique_ips = uniqueIps.size;

    // Calculate views per day
    const views_per_day = {};
    views.forEach(view => {
      const date = view.timestamp.toISOString().split('T')[0];
      views_per_day[date] = (views_per_day[date] || 0) + 1;
    });

    // Get recent views (last 10)
    const recent_views = views.slice(-10).map(view => ({
      ip: view.viewed_by_ip,
      timestamp: view.timestamp,
      user_agent: view.user_agent
    }));

    // Get top viewing countries (simplified - based on IP)
    const ipCountryMap = {};
    views.forEach(view => {
      // Simple country detection based on IP (in real app, use geoip library)
      const country = detectCountryFromIP(view.viewed_by_ip);
      ipCountryMap[country] = (ipCountryMap[country] || 0) + 1;
    });

    const top_countries = Object.entries(ipCountryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, views: count }));

    res.json({
      success: true,
      data: {
        media: {
          id: media._id,
          title: media.title,
          type: media.type
        },
        analytics: {
          total_views,
          unique_ips,
          views_per_day,
          recent_views,
          top_countries,
          time_period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            days: parseInt(days)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media analytics.',
      error: error.message
    });
  }
};

// Helper function for simple country detection (for demo purposes)
function detectCountryFromIP(ip) {
  // This is a simplified version. In production, use a proper geoip library
  if (ip === '::1' || ip === '127.0.0.1') return 'Localhost';
  
  const ipParts = ip.split('.');
  if (ipParts.length === 4) {
    // Simple mapping for demo
    const firstOctet = parseInt(ipParts[0]);
    if (firstOctet >= 1 && firstOctet <= 126) return 'USA';
    if (firstOctet >= 127 && firstOctet <= 191) return 'Europe';
    if (firstOctet >= 192 && firstOctet <= 223) return 'Asia';
  }
  return 'Unknown';
}

// Get all media analytics for admin dashboard
exports.getAllMediaAnalytics = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Get all media for this admin
    const mediaAssets = await MediaAsset.find({ created_by: adminId });

    const analytics = await Promise.all(
      mediaAssets.map(async (media) => {
        const views = await MediaViewLog.find({ media_id: media._id });
        
        const total_views = views.length;
        const uniqueIps = new Set(views.map(view => view.viewed_by_ip));
        const unique_ips = uniqueIps.size;

        return {
          media_id: media._id,
          title: media.title,
          type: media.type,
          total_views,
          unique_ips,
          last_viewed: views.length > 0 ? 
            new Date(Math.max(...views.map(v => v.timestamp))) : null
        };
      })
    );

    // Sort by most viewed
    analytics.sort((a, b) => b.total_views - a.total_views);

    res.json({
      success: true,
      data: {
        total_media: mediaAssets.length,
        total_views: analytics.reduce((sum, item) => sum + item.total_views, 0),
        total_unique_views: analytics.reduce((sum, item) => sum + item.unique_ips, 0),
        media_analytics: analytics
      }
    });

  } catch (error) {
    console.error('Error fetching all analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics dashboard.',
      error: error.message
    });
  }
};