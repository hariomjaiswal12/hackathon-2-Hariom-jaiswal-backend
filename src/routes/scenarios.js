const express = require('express');
const router = express.Router();
const scenarioController = require('../controllers/scenarioController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.post('/calculate', optionalAuth, scenarioController.calculateScenario);
router.post('/save', authenticate, scenarioController.saveScenario);
router.post('/', authenticate, scenarioController.saveScenario);
router.get('/', authenticate, scenarioController.getScenarios);
router.get('/:id', authenticate, scenarioController.getScenarioById);
router.delete('/:id', authenticate, scenarioController.deleteScenario);

module.exports = router;

