/**
 * Standardized API Response Utilities
 */

const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 500, code = 'ERROR', details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};

