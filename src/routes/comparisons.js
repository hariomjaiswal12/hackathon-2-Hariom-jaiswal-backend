const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.post('/calculate', optionalAuth, comparisonController.calculateComparison);
router.get('/', authenticate, comparisonController.getSavedComparisons);
router.post('/', authenticate, comparisonController.saveComparison);
router.get('/:id', authenticate, comparisonController.getComparisonById);
router.delete('/:id', authenticate, comparisonController.deleteComparison);

module.exports = router;

