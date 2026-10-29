const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { careerDnaValidator } = require('../validators/careerValidators');

router.get('/', authenticate, careerController.getCareerDNA);
router.post('/', authenticate, validate(careerDnaValidator), careerController.saveCareerDNA);
router.put('/', authenticate, validate(careerDnaValidator), careerController.saveCareerDNA);
router.delete('/', authenticate, careerController.deleteCareerDNA);

module.exports = router;

