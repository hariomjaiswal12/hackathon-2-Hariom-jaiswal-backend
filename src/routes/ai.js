const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

router.get('/status', aiController.getStatus);
router.post('/ask', optionalAuth, aiController.ask);
router.get('/threads', optionalAuth, aiController.getThreads);
router.get('/threads/:id', optionalAuth, aiController.getThreadById);

module.exports = router;
