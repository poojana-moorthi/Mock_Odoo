const pool = require('../config/db');
const { hashPassword, comparePassword, validatePasswordComplexity } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { seedUserPermissionsFromTemplate } = require('../services/permissionService');
const crypto = require('crypto');

// Map departments to roles to match the DB seed schema
const departmentToRoleMap = {
  'Sales & Marketing': 2,
  'Procurement & Logistics': 3,
  'Manufacturing Operations': 4,
  'Inventory Control': 5,
  'Executive Management': 6
};

/**
 * 1. Admin Sign Up Controller
 * Creates a new Administrator account (role_id = 1)
 */
exports.adminSignup = async (req, res, next) => {
  try {
    const { fullName, email, password, adminSecurityCode } = req.body;

    // Validate presence
    if (!fullName || !email || !password || !adminSecurityCode) {
      return error(res, 'All fields including Admin Security Code are required', 400);
    }

    // Verify security code
    if (adminSecurityCode !== process.env.ADMIN_SECURITY_CODE) {
      return error(res, 'Invalid admin security code', 403);
    }

    // Validate password complexity
    if (!validatePasswordComplexity(password)) {
      return error(
        res,
        'Password does not meet complexity requirements (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character)',
        400
      );
    }

    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return error(res, 'Email is already registered', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user (Admin role_id is 1). Use email as login_id to fulfill DB schema.
    const [result] = await pool.query(
      'INSERT INTO users (full_name, login_id, email, password_hash, role_id, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, email, hashedPassword, 1, 'IT Administration', 'Active']
    );

    const userId = result.insertId;

    // Seed default field-level permissions for Admin
    await seedUserPermissionsFromTemplate(userId, 'Admin');

    // Create system audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
      [userId, 'ADMIN_SIGNUP', 'USER', userId, JSON.stringify({ email, role_id: 1 })]
    );

    // Get created user
    const [newUsers] = await pool.query(
      `SELECT u.id, u.full_name, u.login_id, u.email, u.department, u.status, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );
    const user = newUsers[0];

    // Generate JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role_name });

    return success(res, 'Admin account created successfully', { user, token }, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * 2. User Sign Up Controller
 * Creates a new standard employee/user account (role_id 2-6) based on selected department
 */
exports.userSignup = async (req, res, next) => {
  try {
    const { fullName, email, password, department } = req.body;

    if (!fullName || !email || !password || !department) {
      return error(res, 'Full Name, Email, Password, and Department are required', 400);
    }

    // Map department to role
    const roleId = departmentToRoleMap[department];
    if (!roleId) {
      return error(res, 'Invalid department selected', 400);
    }

    // Verify role exists
    const [roles] = await pool.query('SELECT role_name FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
      return error(res, 'Mapped Role does not exist in database', 400);
    }

    // Validate password complexity
    if (!validatePasswordComplexity(password)) {
      return error(
        res,
        'Password does not meet complexity requirements (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character)',
        400
      );
    }

    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return error(res, 'Email is already registered', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user. Use email as login_id.
    const [result] = await pool.query(
      'INSERT INTO users (full_name, login_id, email, password_hash, role_id, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, email, hashedPassword, roleId, department, 'Active']
    );

    const userId = result.insertId;

    // Seed default field-level permissions for User
    await seedUserPermissionsFromTemplate(userId, 'User');

    // Create system audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
      [userId, 'USER_SIGNUP', 'USER', userId, JSON.stringify({ email, role_id: roleId, department })]
    );

    // Get created user
    const [newUsers] = await pool.query(
      `SELECT u.id, u.full_name, u.login_id, u.email, u.department, u.status, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );
    const user = newUsers[0];

    // Generate JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role_name });

    return success(res, 'User account created successfully', { user, token }, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Login Controller
 * Authenticates user and returns JWT token. Checks userType role segregation.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return error(res, 'Email, Password, and User Type are required', 400);
    }

    // Query user by email or login_id
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.login_id, u.email, u.password_hash, u.department, u.status, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? OR u.login_id = ?`,
      [email, email]
    );

    if (rows.length === 0) {
      return error(res, 'Invalid credentials', 401);
    }

    const user = rows[0];

    // Segregate login based on User Type selection
    if (userType === 'Administrator') {
      if (user.role_name !== 'Admin') {
        return error(res, 'Access denied. This account is not registered as an Administrator.', 403);
      }
    } else if (userType === 'System User') {
      if (user.role_name === 'Admin') {
        return error(res, 'Access denied. Administrators must log in through the Administrator tab.', 403);
      }
    } else {
      return error(res, 'Invalid User Type provided', 400);
    }

    // Check if account is active
    if (user.status !== 'Active') {
      return error(res, 'User account is deactivated. Please contact your administrator', 403);
    }

    // Verify password
    const isPasswordCorrect = await comparePassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return error(res, 'Invalid credentials', 401);
    }

    // Write login log to audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [user.id, 'USER_LOGIN', 'USER', user.id]
    );

    // Generate JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role_name });

    // Exclude password hash from response
    delete user.password_hash;

    return success(res, 'Login successful', { user, token });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Forgot Password Controller
 * Generates password reset token
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, 'Email address is required', 400);
    }

    // Check if user exists
    const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return error(res, 'User with this email does not exist', 404);
    }

    const user = users[0];

    // Delete any old tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    // Save to database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [user.id, 'PASSWORD_RESET_REQUESTED', 'USER', user.id]
    );

    // Return the token for mock/testing purposes
    return success(res, 'Password reset link generated', {
      token,
      expiresAt: expiresAt.toISOString(),
      message: 'In production, this link is emailed. For mock purposes, it is returned here.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Reset Password Controller
 * Consumes reset token and sets new password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return error(res, 'Token and New Password are required', 400);
    }

    // Query token and join with user
    const [tokens] = await pool.query(
      `SELECT t.user_id, t.expires_at, u.full_name, u.email
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = ?`,
      [token]
    );

    if (tokens.length === 0) {
      return error(res, 'Invalid password reset token', 400);
    }

    const tokenRecord = tokens[0];

    // Check expiry
    const expiry = new Date(tokenRecord.expires_at);
    if (expiry < new Date()) {
      await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
      return error(res, 'Password reset token has expired', 400);
    }

    // Validate password complexity
    if (!validatePasswordComplexity(newPassword)) {
      return error(
        res,
        'Password does not meet complexity requirements (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character)',
        400
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, tokenRecord.user_id]);

    // Delete token
    await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [tokenRecord.user_id, 'PASSWORD_RESET_SUCCESS', 'USER', tokenRecord.user_id]
    );

    return success(res, 'Password reset successfully. You can now log in with your new password.');
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Get Current User Controller
 * Returns active user details from request (populated by protect middleware)
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return error(res, 'Not authenticated', 401);
    }
    return success(res, 'Current user retrieved successfully', { user: req.user });
  } catch (err) {
    next(err);
  }
};
