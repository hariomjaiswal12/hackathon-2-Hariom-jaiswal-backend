const { body } = require('express-validator');

const updateSettingsValidator = [
  body('profile.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('profile.email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('profile.careerStage')
    .optional()
    .isIn(['Student', 'Fresher', '1-2 years', '3+ years', 'Early Career', 'Mid-Senior', 'Senior', 'Lead'])
    .withMessage('Invalid career stage'),
  body('profile.targetRole')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Target role cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Target role must be under 100 characters'),

  // Research preferences (primary & alias support)
  body('researchPreferences.defaultLocation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be under 100 characters'),
  body('preferences.defaultLocation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be under 100 characters'),

  body('researchPreferences.preferredWorkStyle')
    .optional()
    .isIn(['Remote', 'Hybrid', 'On-site'])
    .withMessage('Invalid preferred work style'),
  body('preferences.preferredWorkStyle')
    .optional()
    .isIn(['Remote', 'Hybrid', 'On-site'])
    .withMessage('Invalid preferred work style'),

  body('researchPreferences.showSourceMetadata')
    .optional()
    .isBoolean()
    .withMessage('showSourceMetadata must be a boolean'),
  body('preferences.showSourceMetadata')
    .optional()
    .isBoolean()
    .withMessage('showSourceMetadata must be a boolean'),

  body('researchPreferences.showConfidence')
    .optional()
    .isBoolean()
    .withMessage('showConfidence must be a boolean'),
  body('preferences.showConfidenceScore')
    .optional()
    .isBoolean()
    .withMessage('showConfidenceScore must be a boolean'),

  body('researchPreferences.useCareerDNAForRecommendations')
    .optional()
    .isBoolean()
    .withMessage('useCareerDNAForRecommendations must be a boolean'),
  body('preferences.useCareerDNA')
    .optional()
    .isBoolean()
    .withMessage('useCareerDNA must be a boolean'),

  // Notification preferences (primary & alias support)
  body('notificationPreferences.evidenceUpdates')
    .optional()
    .isBoolean()
    .withMessage('evidenceUpdates must be a boolean'),
  body('notifications.evidenceUpdates')
    .optional()
    .isBoolean()
    .withMessage('evidenceUpdates must be a boolean'),

  body('notificationPreferences.sourceConflictAlerts')
    .optional()
    .isBoolean()
    .withMessage('sourceConflictAlerts must be a boolean'),
  body('notifications.sourceConflictAlerts')
    .optional()
    .isBoolean()
    .withMessage('sourceConflictAlerts must be a boolean'),

  body('notificationPreferences.emailDigest')
    .optional()
    .isBoolean()
    .withMessage('emailDigest must be a boolean'),
  body('notifications.emailDigest')
    .optional()
    .isBoolean()
    .withMessage('emailDigest must be a boolean'),

  body('notificationPreferences.digestFrequency')
    .optional()
    .isIn(['Daily', 'Weekly', 'Monthly', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid digest frequency'),
  body('notifications.frequency')
    .optional()
    .isIn(['Daily', 'Weekly', 'Monthly', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid digest frequency'),
];

module.exports = {
  updateSettingsValidator,
};
