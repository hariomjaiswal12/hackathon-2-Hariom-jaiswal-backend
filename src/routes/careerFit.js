const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/', authenticate, careerController.getAllCareerFits);
router.get('/:companyId', optionalAuth, careerController.getCompanyCareerFit);

module.exports = router;

