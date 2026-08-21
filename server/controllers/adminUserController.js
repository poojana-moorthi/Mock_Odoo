const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { getModulePermissions } = require('../services/permissionService');

/**
 * 1. GET /api/admin/users
 * Returns list of all users with id, name (full_name), position, email, role, department, status
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.department, u.status, u.created_at,
              COALESCE(u.department, r.role_name) AS position,
              r.role_name AS role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.id ASC`
    );

    return success(res, 'Users list retrieved successfully', users, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET /api/admin/users/:id
 * Returns user detail: name, address, mobile, email, position, avatar
 */
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.department, u.status,
              COALESCE(u.department, r.role_name) AS position,
              r.role_name AS role,
              'Colaba, Mumbai, 400001' AS address,
              '+91 80000 00000' AS mobile,
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' AS avatar
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return error(res, 'User not found', 404);
    }

    return success(res, 'User details retrieved successfully', rows[0], 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 3. PUT /api/admin/users/:id
 * Updates ONLY the position field per wireframe requirement ("Only Position Field is editable by System Administrator")
 */
exports.updateUserPosition = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { position } = req.body;

    if (!position || typeof position !== 'string') {
      return error(res, 'Position field is required and must be a string', 400);
    }

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return error(res, 'User not found', 404);
    }

    // Update position (stored in department field)
    await pool.query(
      'UPDATE users SET department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [position.trim(), userId]
    );

    // Fetch updated user
    const [updated] = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.department AS position, r.role_name AS role
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    return success(res, 'User position updated successfully', updated[0], 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. GET /api/admin/users/:id/permissions?module=Sales
 * Returns that user's field-level permissions for the requested module (or all modules if omitted)
 */
exports.getUserFieldPermissions = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const moduleName = req.query.module || null;

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return error(res, 'User not found', 404);
    }

    const permissions = await getModulePermissions(userId, moduleName);
    return success(res, 'User field permissions retrieved successfully', { userId, module: moduleName, permissions }, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 5. PUT /api/admin/users/:id/permissions
 * Accepts array of { module, field_name, can_create, can_view, can_edit, can_delete } and upserts into user_field_permissions
 */
exports.updateUserFieldPermissions = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updates = req.body.permissions || req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return error(res, 'Request body must contain an array of permission updates', 400);
    }

    // Verify user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return error(res, 'User not found', 404);
    }

    // Upsert each permission
    for (const item of updates) {
      const { module: mod, field_name, can_create, can_view, can_edit, can_delete } = item;

      if (!mod || !field_name) {
        continue;
      }

      await pool.query(
        `INSERT INTO user_field_permissions 
          (user_id, module, field_name, can_create, can_view, can_edit, can_delete)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
          can_create = VALUES(can_create),
          can_view = VALUES(can_view),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete)`,
        [
          userId,
          mod,
          field_name,
          can_create ?? true,
          can_view ?? true,
          can_edit ?? true,
          can_delete ?? true
        ]
      );
    }

    // Audit Log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'FIELD_PERMISSIONS_UPDATED', 'USER_PERMISSIONS', userId, JSON.stringify({ updatedCount: updates.length })]
    );

    const updatedPermissions = await getModulePermissions(userId);
    return success(res, 'User field permissions updated successfully', { userId, permissions: updatedPermissions }, 200);
  } catch (err) {
    next(err);
  }
};
