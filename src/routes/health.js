const express = require('express');
const router = express.Router();
const { getDBStatus } = require('../config/db');

// Overall health endpoint
router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus === 'connected';

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'CompanyIQ Backend API',
    version: '1.0.0',
  });
});

// Cloud / Kubernetes readiness probe: checks database dependency
router.get('/ready', (req, res) => {
  const dbStatus = getDBStatus();
  const isReady = dbStatus === 'connected';

  return res.status(isReady ? 200 : 503).json({
    ready: isReady,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Cloud / Kubernetes liveness probe: verifies web server event loop responsiveness
router.get('/live', (req, res) => {
  return res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

module.exports = router;
