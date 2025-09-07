const MediaAsset = require('../models/MediaAsset');
const MediaViewLog = require('../models/MediaViewLog');
const geoip = require('geoip-lite');
const redisClient = require('../config/redis'); // make sure you created config/redis.js

// Log a media view
exports.logView = async (req, res) => {
  try {
    const { id } = req.params;
    const userIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
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
      token_used: req.query.token || 'direct'
    });

    await viewLog.save();

    // Update media view count
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
// Get media analytics with Redis caching - FIXED VERSION
exports.getAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const cacheKey = `media:${id}:analytics:${days}`;

    // 1. Try cache first
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: JSON.parse(cachedData),
        cache: true,
      });
    }

    // Check if media exists
    const media = await MediaAsset.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media asset not found.",
      });
    }

    if (media.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view analytics for your own media.",
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const views = await MediaViewLog.find({
      media_id: id,
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });

    const total_views = views.length;
    const uniqueIps = new Set(views.map((v) => v.viewed_by_ip));
    const unique_ips = uniqueIps.size;

    const views_per_day = {};
    views.forEach((v) => {
      const date = v.timestamp.toISOString().split("T")[0];
      views_per_day[date] = (views_per_day[date] || 0) + 1;
    });

    const recent_views = views.slice(-10).map((v) => ({
      ip: v.viewed_by_ip,
      timestamp: v.timestamp,
      user_agent: v.user_agent,
    }));

    const ipCountryMap = {};
    views.forEach((v) => {
      const country = detectCountryFromIP(v.viewed_by_ip);
      ipCountryMap[country] = (ipCountryMap[country] || 0) + 1;
    });

    const top_countries = Object.entries(ipCountryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, views: count }));

    const responseData = {
      media: {
        id: media._id,
        title: media.title,
        type: media.type,
      },
      analytics: {
        total_views,
        unique_ips,
        views_per_day,
        recent_views,
        top_countries,
        time_period: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          days: parseInt(days),
        },
      },
    };

    // 2. Store in cache (expire in 1 hour) - non-blocking
    redisClient.setex(cacheKey, 3600, JSON.stringify(responseData));

    res.json({
      success: true,
      data: responseData,
      cache: false,
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching media analytics.",
      error: error.message,
    });
  }
};

// exports.getAnalytics = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { days = 30 } = req.query;

//     // Check if media exists
//     const media = await MediaAsset.findById(id);
//     if (!media) {
//       return res.status(404).json({
//         success: false,
//         message: 'Media asset not found.'
//       });
//     }

//     // Verify user owns this media
//     if (media.created_by.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. You can only view analytics for your own media.'
//       });
//     }

//     // Calculate date range
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - parseInt(days));

//     // Get all views for this media
//     const views = await MediaViewLog.find({
//       media_id: id,
//       timestamp: { $gte: startDate, $lte: endDate }
//     }).sort({ timestamp: 1 });

//     // Calculate analytics
//     const total_views = views.length;
    
//     // Get unique IPs
//     const uniqueIps = new Set(views.map(view => view.viewed_by_ip));
//     const unique_ips = uniqueIps.size;

//     // Calculate views per day
//     const views_per_day = {};
//     views.forEach(view => {
//       const date = view.timestamp.toISOString().split('T')[0];
//       views_per_day[date] = (views_per_day[date] || 0) + 1;
//     });

//     // Get recent views (last 10)
//     const recent_views = views.slice(-10).map(view => ({
//       ip: view.viewed_by_ip,
//       timestamp: view.timestamp,
//       user_agent: view.user_agent
//     }));

//     // Get top viewing countries using geoip
//     const ipCountryMap = {};
//     views.forEach(view => {
//       const country = detectCountryFromIP(view.viewed_by_ip);
//       ipCountryMap[country] = (ipCountryMap[country] || 0) + 1;
//     });

//     const top_countries = Object.entries(ipCountryMap)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 5)
//       .map(([country, count]) => ({ country, views: count }));

//     res.json({
//       success: true,
//       data: {
//         media: {
//           id: media._id,
//           title: media.title,
//           type: media.type
//         },
//         analytics: {
//           total_views,
//           unique_ips,
//           views_per_day,
//           recent_views,
//           top_countries,
//           time_period: {
//             start: startDate.toISOString().split('T')[0],
//             end: endDate.toISOString().split('T')[0],
//             days: parseInt(days)
//           }
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching analytics:', error);
    
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid media ID format.'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching media analytics.',
//       error: error.message
//     });
//   }
// };

// Helper function for country detection using geoip
function detectCountryFromIP(ip) {
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown') {
    return 'Localhost';
  }
  
  try {
    const geo = geoip.lookup(ip);
    return geo ? geo.country : 'Unknown';
  } catch (error) {
    console.error('Error in geoip lookup:', error);
    return 'Unknown';
  }
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

        const lastView = await MediaViewLog.findOne({ media_id: media._id })
          .sort({ timestamp: -1 })
          .select('timestamp');

        return {
          media_id: media._id,
          title: media.title,
          type: media.type,
          total_views,
          unique_ips,
          last_viewed: lastView ? lastView.timestamp : null
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
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: "Invalid media ID format."
        });
      }
    
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching media analytics.",
      });
  }
};