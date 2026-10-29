const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const details = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
  };
};

module.exports = validate;

