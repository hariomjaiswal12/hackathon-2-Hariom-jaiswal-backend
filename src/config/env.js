const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Attempt to load local .env file if it exists (for local development)
// In production hosting providers, environment variables are injected directly into process.env
const envFilePath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Resolve database URI
// Allows TEST_MONGODB_URI during test runs, otherwise uses MONGODB_URI
let resolvedMongoUri = isTest && process.env.TEST_MONGODB_URI
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI;

// Enforce production database constraints
if (isProduction) {
  if (!resolvedMongoUri) {
    console.error('[FATAL CONFIG] MONGODB_URI environment variable is required in production mode.');
    process.exit(1);
  }
  if (resolvedMongoUri.includes('127.0.0.1') || resolvedMongoUri.includes('localhost')) {
    console.error('[FATAL CONFIG] Localhost MONGODB_URI is prohibited in production mode. Configure a production MongoDB Atlas connection string.');
    process.exit(1);
  }
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.includes('_dev')) {
    console.error('[FATAL CONFIG] JWT_ACCESS_SECRET must be configured with a secure production secret in production mode.');
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('_dev')) {
    console.error('[FATAL CONFIG] JWT_REFRESH_SECRET must be configured with a secure production secret in production mode.');
    process.exit(1);
  }
} else {
  // Safe default fallback only in development / test environments
  if (!resolvedMongoUri) {
    resolvedMongoUri = 'mongodb://127.0.0.1:27017/companyiq';
  }
}

const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: nodeEnv,
  MONGODB_URI: resolvedMongoUri,
  DB_MAX_POOL_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE || '25', 10),
  DB_MIN_POOL_SIZE: parseInt(process.env.DB_MIN_POOL_SIZE || '2', 10),
  DB_SERVER_SELECTION_TIMEOUT_MS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
  DB_SOCKET_TIMEOUT_MS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS || '45000', 10),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'companyiq_jwt_access_secret_super_secure_key_2026_dev',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'companyiq_jwt_refresh_secret_super_secure_key_2026_dev',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  DEMO_PASSWORD: process.env.DEMO_PASSWORD || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  // Google OAuth 2.0 Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
  // Company Data Providers Configuration
  OPENCORPORATES_API_TOKEN: process.env.OPENCORPORATES_API_TOKEN || '',
  COMPANIES_HOUSE_API_KEY: process.env.COMPANIES_HOUSE_API_KEY || '',
  COMPANY_DATA_PROVIDERS: process.env.COMPANY_DATA_PROVIDERS || 'mca,wikidata,clearbit,opencorporates,companies_house',
  CACHE_TTL_HOURS: parseInt(process.env.CACHE_TTL_HOURS || '24', 10),
  PROVIDER_TIMEOUT_MS: parseInt(process.env.PROVIDER_TIMEOUT_MS || '4000', 10),
};

module.exports = env;
