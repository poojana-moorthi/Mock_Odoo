/**
 * Standardized API Response Utilities
 */

/**
 * Send a success response
 * @param {Object} res Express response object
 * @param {string} message Description message
 * @param {any} data Response payload data
 * @param {number} statusCode HTTP Status code (default: 200)
 */
exports.success = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res Express response object
 * @param {string} message Error description message
 * @param {number} statusCode HTTP Status code (default: 500)
 * @param {any} errors Specific details about validation errors
 */
exports.error = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
