const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');
const { error } = require('../utils/response');

/**
 * Express middleware to protect API routes and verify JWT tokens
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for Token in Authorization Header (Bearer Token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return error(res, 'Not authorized, token is missing', 401);
  }

  try {
    // 1. Verify token payload
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return error(res, 'Not authorized, token is invalid or expired', 401);
    }

    // 2. Query user from DB (including role metadata)
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.login_id, u.email, u.department, u.status, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return error(res, 'Authorization failed, user record no longer exists', 401);
    }

    const user = rows[0];

    // 3. Verify user status
    if (user.status !== 'Active') {
      return error(
        res,
        'User account is deactivated. Please contact your administrator',
        403
      );
    }

    // 4. Attach user context to request
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error] Failed to authorize user token:', err);
    return error(res, 'Not authorized, security validation failed', 401);
  }
};
