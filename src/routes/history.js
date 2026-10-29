const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, historyController.getHistory);
router.post('/', authenticate, historyController.addHistory);
router.delete('/', authenticate, historyController.clearHistory);

module.exports = router;

