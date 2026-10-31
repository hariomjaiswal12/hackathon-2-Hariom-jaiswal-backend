const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  googleAuthValidator,
} = require('../validators/authValidators');

router.post('/register', validate(registerValidator), authController.register);
router.post('/login', validate(loginValidator), authController.login);
router.get('/google', authController.googleAuthInit);
router.get('/google/callback', authController.googleCallback);
router.post('/google', validate(googleAuthValidator), authController.googleLogin);
router.post('/demo', authController.demoLogin);
router.get('/me', authenticate, authController.getMe);
router.post('/refresh', validate(refreshValidator), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidator), authController.resetPassword);

module.exports = router;

