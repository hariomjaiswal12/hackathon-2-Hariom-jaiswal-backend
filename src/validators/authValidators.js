const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('careerStage')
    .optional()
    .isIn(['Student', 'Fresher', '1-2 years', '3+ years'])
    .withMessage('Invalid career stage'),
  body('preferredWorkStyle')
    .optional()
    .isIn(['Remote', 'Hybrid', 'On-site'])
    .withMessage('Invalid preferred work style'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const googleAuthValidator = [
  body().custom((val, { req }) => {
    const token = req.body?.credential || req.body?.idToken || req.body?.token;
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Google credential / ID token is required');
    }
    return true;
  }),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  googleAuthValidator,
};

