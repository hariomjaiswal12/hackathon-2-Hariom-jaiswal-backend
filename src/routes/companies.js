const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const jobController = require('../controllers/jobController');
const { optionalAuth, authenticate, requireAdmin } = require('../middleware/auth');

// Public and enhanced company endpoints
router.get('/', optionalAuth, companyController.getCompanies);
router.get('/suggestions', companyController.getSuggestions);

// Company submission workflow (community / representative submission)
router.post('/submit', optionalAuth, companyController.submitCompany);

// Admin-only submission review endpoints
router.get('/admin/submissions', authenticate, requireAdmin, companyController.getSubmissions);
router.patch('/admin/submissions/:id/verify', authenticate, requireAdmin, companyController.verifySubmission);

// Individual company details & evidence
router.get('/:id/evidence', optionalAuth, companyController.getEvidence);
router.get('/:id/sources', optionalAuth, companyController.getSources);
router.get('/:id/review-insights', optionalAuth, companyController.getReviewInsights);

// Real-time verified job discovery & careers portal
router.get('/:id/jobs', optionalAuth, jobController.getCompanyJobs);
router.get('/:id/careers', optionalAuth, jobController.getCareersSummary);
router.post('/:id/jobs/refresh', optionalAuth, jobController.refreshCompanyJobs);
router.get('/:id/jobs/:jobId', optionalAuth, jobController.getJobById);

router.get('/:id', optionalAuth, companyController.getCompanyById);

module.exports = router;
