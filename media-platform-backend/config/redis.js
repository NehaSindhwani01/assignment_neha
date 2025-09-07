// config/redis.js - Improved version
const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');  
    });

    this.connected = false;
  }

  async connect() {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (err) {
      console.error('❌ Redis connection failed:', err);
      this.connected = false;
    }
  }

  async quit() {
    if (this.connected) {
      try {
        await this.client.quit();
        this.connected = false;
        console.log('Redis connection closed');
      } catch (err) {
        console.error('Redis quit error:', err);
      }
    }
  }

  async get(key) {
    if (!this.connected) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error('Redis get error:', err);
      return null;
    }
  }

  async setex(key, seconds, value) {
    if (!this.connected) return;
    try {
      await this.client.setEx(key, seconds, value);
    } catch (err) {
      console.error('Redis setex error:', err);
    }
  }
}

const redisClient = new RedisClient();
// Connect immediately
redisClient.connect();

module.exports = redisClient;