const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await AdminUser.findById(decoded.userId).select('-hashed_password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid.'
    });
  }
};

// Generate streaming token (short-lived, 10 minutes)
const generateStreamToken = (mediaId, userIp) => {
  return jwt.sign(
    { 
      mediaId, 
      userIp,
      type: 'stream' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
};

// Verify streaming token middleware
const verifyStreamToken = (req, res, next) => {
  try {
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Streaming token required.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'stream') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.'
      });
    }

    req.streamData = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Streaming token is invalid or expired.'
    });
  }
};

module.exports = {
  verifyToken,
  generateStreamToken,
  verifyStreamToken
};