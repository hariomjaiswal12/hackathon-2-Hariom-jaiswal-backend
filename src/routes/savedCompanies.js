const express = require('express');
const router = express.Router();
const savedCompanyController = require('../controllers/savedCompanyController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, savedCompanyController.getSavedCompanies);
router.post('/:companyId', authenticate, savedCompanyController.saveCompany);
router.delete('/:companyId', authenticate, savedCompanyController.unsaveCompany);

module.exports = router;

