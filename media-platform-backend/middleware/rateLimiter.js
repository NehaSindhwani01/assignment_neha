// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// Limit: 10 requests per minute per IP for logging views
const viewRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: "Too many view requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = viewRateLimiter;
