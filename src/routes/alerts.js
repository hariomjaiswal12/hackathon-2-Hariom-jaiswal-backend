const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { optionalAuth, authenticate } = require('../middleware/auth');

router.get('/', optionalAuth, alertController.getAlerts);
router.patch('/:id/read', authenticate, alertController.markAlertAsRead);

module.exports = router;

