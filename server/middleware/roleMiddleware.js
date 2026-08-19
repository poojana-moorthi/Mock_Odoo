const { error } = require('../utils/response');

/**
 * Middleware to restrict route access by user role
 * @param {...string} allowedRoles Roles allowed to access the route
 */
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return error(res, 'Forbidden, no user access role found', 403);
    }

    // Administrators bypass all role boundaries and have full system access
    if (req.user.role_name === 'Admin') {
      return next();
    }

    // Check if user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role_name)) {
      return error(
        res,
        `Access denied. Your role (${req.user.role_name}) is not authorized to access this resource.`,
        403
      );
    }

    next();
  };
};
