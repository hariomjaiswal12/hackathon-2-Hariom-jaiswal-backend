const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, alertController.getWatchlist);
router.post('/:companyId', authenticate, alertController.addToWatchlist);
router.delete('/:companyId', authenticate, alertController.removeFromWatchlist);

module.exports = router;

