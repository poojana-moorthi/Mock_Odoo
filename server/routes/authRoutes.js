const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// 1. Admin Sign Up Route
router.post('/admin-signup', authController.adminSignup);

// 2. User Sign Up Route
router.post('/user-signup', authController.userSignup);

// 3. Login Route (Handles both User and Admin based on body parameters)
router.post('/login', authController.login);

// 4. Forgot Password Request Route
router.post('/forgot-password', authController.forgotPassword);

// 5. Reset Password Execution Route
router.post('/reset-password', authController.resetPassword);

// 6. Get Current Authenticated User Context Route
router.get('/me', protect, authController.getCurrentUser);

module.exports = router;
