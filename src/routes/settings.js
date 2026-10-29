const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateSettingsValidator } = require('../validators/settingsValidators');

router.get('/', authenticate, settingsController.getSettings);
router.put('/', authenticate, validate(updateSettingsValidator), settingsController.updateSettings);
router.patch('/', authenticate, validate(updateSettingsValidator), settingsController.updateSettings);
router.get('/export', authenticate, settingsController.exportUserData);
router.delete('/history', authenticate, settingsController.clearHistory);
router.delete('/career-dna', authenticate, settingsController.deleteCareerDNA);
router.delete('/saved-companies', authenticate, settingsController.clearSavedCompanies);

module.exports = router;
