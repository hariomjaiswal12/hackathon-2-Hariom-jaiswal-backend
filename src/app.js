const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Route imports
const healthRoutes = require('./routes/health');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const configuredOrigins = (env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const allowedOrigins = env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...new Set([...configuredOrigins, ...devOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like health checks, mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.indexOf(normalizedOrigin) !== -1 || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiter
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'production' ? env.RATE_LIMIT_MAX : 50000,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes registration
const API_PREFIX = '/api/v1';

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(`${API_PREFIX}/health`, healthRoutes);

// Health check alias directly on /health for standard cloud platforms
app.use('/health', healthRoutes);

// Placeholder for router registration in upcoming phases
app.use(`${API_PREFIX}/auth`, require('./routes/auth'));
app.use(`${API_PREFIX}/companies`, require('./routes/companies'));
app.use(`${API_PREFIX}/jobs`, require('./routes/jobs'));
app.use(`${API_PREFIX}/career-dna`, require('./routes/careerDna'));
app.use(`${API_PREFIX}/career-fit`, require('./routes/careerFit'));
app.use(`${API_PREFIX}/comparisons`, require('./routes/comparisons'));
app.use(`${API_PREFIX}/saved-companies`, require('./routes/savedCompanies'));
app.use(`${API_PREFIX}/saved`, require('./routes/savedCompanies'));
app.use(`${API_PREFIX}/scenarios`, require('./routes/scenarios'));
app.use(`${API_PREFIX}/history`, require('./routes/history'));
app.use(`${API_PREFIX}/ai`, require('./routes/ai'));
app.use(`${API_PREFIX}/alerts`, require('./routes/alerts'));
app.use(`${API_PREFIX}/watchlist`, require('./routes/watchlist'));
app.use(`${API_PREFIX}/dashboard`, require('./routes/dashboard'));
app.use(`${API_PREFIX}/settings`, require('./routes/settings'));

// 404 and Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

