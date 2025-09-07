// tests/setup.js
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await connectDB();
});

// Global test teardown
afterAll(async () => {
  // Close MongoDB connection
  await mongoose.connection.close();
  
  // Close Redis connection
  try {
    const redisClient = require('../config/redis');
    if (redisClient && typeof redisClient.quit === 'function') {
      await redisClient.quit();
    }
  } catch (error) {
    console.log('Redis connection already closed or not available:', error.message);
  }
});