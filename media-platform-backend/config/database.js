// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use test database URI for test environment
    let mongoURI;
    
    if (process.env.NODE_ENV === 'test') {
      mongoURI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/media_platform_test';
    } else {
      mongoURI = process.env.MONGODB_URI;
    }

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;