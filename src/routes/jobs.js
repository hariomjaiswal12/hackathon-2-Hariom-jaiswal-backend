const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { optionalAuth } = require('../middleware/auth');

// Job listings query endpoint
router.get('/', optionalAuth, (req, res, next) => {
  if (req.query.company || req.query.companySlug) {
    req.params.id = req.query.company || req.query.companySlug;
    return jobController.getCompanyJobs(req, res, next);
  }
  return res.status(200).json({
    success: true,
    data: {
      jobs: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasMore: false },
    },
  });
});

// Single job listing details
router.get('/:jobId', optionalAuth, jobController.getJobById);

module.exports = router;

