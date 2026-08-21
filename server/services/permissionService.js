const pool = require('../config/db');

/**
 * Normalizes a role string to match template roles ('Admin' or 'User')
 * @param {string|number} role - User role string or role_id
 */
const getTemplateRoleKey = (role) => {
  if (role === 1 || role === '1') return 'Admin';
  if (!role) return 'User';
  const str = String(role).replace(/\s+/g, '').toLowerCase();
  if (str === 'admin' || str === 'administrator') return 'Admin';
  return 'User';
};

/**
 * Seeds field-level permissions for a newly created user from default permission_templates
 * @param {number} userId - ID of the newly created user
 * @param {string|number} role - Role name or ID of the user
 */
async function seedUserPermissionsFromTemplate(userId, role) {
  const templateRole = getTemplateRoleKey(role);

  try {
    // 1. Fetch matching templates for role
    const [templates] = await pool.query(
      'SELECT module, field_name, can_create, can_view, can_edit, can_delete FROM permission_templates WHERE role = ?',
      [templateRole]
    );

    if (templates.length === 0) {
      console.warn(`[Permission Service] No permission templates found for role: ${templateRole}`);
      return false;
    }

    // 2. Insert into user_field_permissions
    for (const t of templates) {
      await pool.query(
        `INSERT INTO user_field_permissions 
          (user_id, module, field_name, can_create, can_view, can_edit, can_delete) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
          can_create = VALUES(can_create),
          can_view = VALUES(can_view),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete)`,
        [userId, t.module, t.field_name, t.can_create, t.can_view, t.can_edit, t.can_delete]
      );
    }

    console.log(`[Permission Service] Successfully seeded ${templates.length} field permissions for User ID #${userId} (${templateRole})`);
    return true;
  } catch (err) {
    console.error(`[Permission Service Error] Failed to seed permissions for User ID #${userId}:`, err);
    throw err;
  }
}

/**
 * Fetches all field-level permissions for a specific user and module (or all modules if module is omitted)
 * @param {number} userId - User ID
 * @param {string} [moduleName] - Optional module filter (e.g. 'Sales', 'Purchase')
 */
async function getModulePermissions(userId, moduleName = null) {
  let query = 'SELECT module, field_name, can_create, can_view, can_edit, can_delete FROM user_field_permissions WHERE user_id = ?';
  const params = [userId];

  if (moduleName) {
    query += ' AND LOWER(module) = LOWER(?)';
    params.push(moduleName);
  }

  query += ' ORDER BY module ASC, id ASC';

  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Helper to check whether a user has permission for a specific module, field, and action
 * @param {number} userId - User ID
 * @param {string} moduleName - Module name (e.g., 'Sales')
 * @param {string} fieldName - Field name (e.g., 'customer')
 * @param {string} action - 'create' | 'view' | 'edit' | 'delete'
 */
async function checkUserFieldPermission(userId, moduleName, fieldName, action) {
  const validActions = ['create', 'view', 'edit', 'delete'];
  const actionCol = `can_${action.toLowerCase()}`;

  if (!validActions.includes(action.toLowerCase())) {
    throw new Error(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
  }

  const [rows] = await pool.query(
    `SELECT ${actionCol} AS allowed 
     FROM user_field_permissions 
     WHERE user_id = ? AND LOWER(module) = LOWER(?) AND LOWER(field_name) = LOWER(?)`,
    [userId, moduleName, fieldName]
  );

  if (rows.length === 0) {
    return false; // Default to false if permission row not found
  }

  return Boolean(rows[0].allowed);
}

/**
 * Express Middleware factory to enforce field-level permission on a route
 * @param {string} moduleName 
 * @param {string} fieldName 
 * @param {string} action 
 */
function checkFieldPermission(moduleName, fieldName, action) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized: User missing' });
      }

      const isAllowed = await checkUserFieldPermission(req.user.id, moduleName, fieldName, action);

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You do not have '${action}' permission on field '${fieldName}' in ${moduleName} module`
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  seedUserPermissionsFromTemplate,
  getModulePermissions,
  checkUserFieldPermission,
  checkFieldPermission
};
