const { body } = require('express-validator');

const careerDnaValidator = [
  body('targetRole').optional().trim().notEmpty().withMessage('Target role cannot be empty'),
  body('experience')
    .optional()
    .isIn(['Student', 'Fresher', '1-2 years', '3+ years'])
    .withMessage('Experience must be Student, Fresher, 1-2 years, or 3+ years'),
  body('workStyle')
    .optional()
    .isIn(['Remote', 'Hybrid', 'On-site'])
    .withMessage('Work style must be Remote, Hybrid, or On-site'),
  body('preferredLocation').optional().trim(),
  body('skills').optional().isArray().withMessage('Skills must be an array of strings'),
  body('priorities').optional().isObject().withMessage('Priorities must be an object'),
  body('priorities.learning')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Learning priority must be between 0 and 100'),
  body('priorities.growth')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Growth priority must be between 0 and 100'),
  body('priorities.stability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Stability priority must be between 0 and 100'),
  body('priorities.culture')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Culture priority must be between 0 and 100'),
  body('priorities.wlb')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Work-life balance priority must be between 0 and 100'),
  body('priorities.salary')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Salary priority must be between 0 and 100'),
  body('priorities.technology')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Technology priority must be between 0 and 100'),
  body('priorities.location')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Location priority must be between 0 and 100'),
];

module.exports = {
  careerDnaValidator,
};

