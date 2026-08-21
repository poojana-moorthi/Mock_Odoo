const { error } = require('../utils/response');

/**
 * Normalizes role strings to match canonical forms:
 * Admin, SalesUser, PurchaseUser, ManufacturingUser, InventoryManager, BusinessOwner
 */
const normalizeRole = (roleStr) => {
  if (!roleStr) return '';
  const cleaned = roleStr.replace(/\s+/g, '').toLowerCase();
  if (cleaned === 'admin' || cleaned === 'administrator') return 'Admin';
  if (cleaned === 'salesuser' || cleaned === 'sales') return 'SalesUser';
  if (cleaned === 'purchaseuser' || cleaned === 'purchase') return 'PurchaseUser';
  if (cleaned === 'manufacturinguser' || cleaned === 'manufacturing') return 'ManufacturingUser';
  if (cleaned === 'inventorymanager' || cleaned === 'inventory') return 'InventoryManager';
  if (cleaned === 'businessowner' || cleaned === 'owner') return 'BusinessOwner';
  return roleStr;
};

/**
 * Express middleware to enforce Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles - List of allowed roles (e.g. 'Admin', 'SalesUser')
 */
exports.requireRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Not authorized, user profile missing', 401);
    }

    const userRole = normalizeRole(req.user.role_name || req.user.role);

    // 1. Check if user's role is in allowed roles list
    const isRoleAllowed = normalizedAllowed.includes(userRole);

    if (!isRoleAllowed) {
      return error(
        res,
        `Forbidden: Role "${req.user.role_name || userRole}" is not authorized to access this route`,
        403
      );
    }

    // 2. Special BusinessOwner Rule: Read-Only (GET) access only
    if (userRole === 'BusinessOwner' && req.method !== 'GET') {
      return error(
        res,
        'Forbidden: BusinessOwner has read-only access to module resources',
        403
      );
    }

    next();
  };
};

exports.normalizeRole = normalizeRole;
