const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const sanitizeHost = (hostStr = '') => {
  // Strip any accidental credentials or tokens from host strings
  return hostStr.replace(/[^a-zA-Z0-9.-]/g, '');
};

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: env.DB_MAX_POOL_SIZE,
      minPoolSize: env.DB_MIN_POOL_SIZE,
      serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: env.DB_SOCKET_TIMEOUT_MS,
      autoIndex: env.NODE_ENV !== 'production', // Disable expensive index builds in production runtime
    });

    isConnected = conn.connections[0].readyState === 1;
    const sanitizedHost = sanitizeHost(conn.connection.host);
    logger.info(`MongoDB connected: ${sanitizedHost}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      // Safe error logging: strip any URI if present in error message
      const safeMessage = (err.message || '').replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, 'mongodb+srv://[REDACTED]@');
      logger.error('MongoDB connection error:', safeMessage);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
      isConnected = true;
    });

    return conn;
  } catch (error) {
    const safeMsg = (error.message || '').replace(/mongodb(\+srv)?:\/\/[^@\s]+@/g, 'mongodb+srv://[REDACTED]@');
    logger.error('Error connecting to MongoDB:', safeMsg);
    throw error;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected cleanly');
};

const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};
