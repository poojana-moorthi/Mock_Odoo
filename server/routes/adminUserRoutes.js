const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const adminUserController = require('../controllers/adminUserController');

// All /api/admin/* routes are strictly restricted to Admin role
router.use(protect);
router.use(requireRole('Admin'));

// User Management Routes
router.route('/users')
  .get(adminUserController.getAllUsers);

router.route('/users/:id')
  .get(adminUserController.getUserById)
  .put(adminUserController.updateUserPosition);

router.route('/users/:id/permissions')
  .get(adminUserController.getUserFieldPermissions)
  .put(adminUserController.updateUserFieldPermissions);

module.exports = router;
