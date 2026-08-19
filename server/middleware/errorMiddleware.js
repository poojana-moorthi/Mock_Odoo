const { error } = require('../utils/response');

/**
 * Centralized error handler middleware
 */
module.exports = (err, req, res, next) => {
  console.error('[Error Handler Log]:', err.stack || err);

  // Set default status code and message if not present
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Format response consistently
  return error(
    res, 
    message, 
    statusCode, 
    process.env.NODE_ENV === 'development' ? { stack: err.stack, details: err.errors } : null
  );
};
