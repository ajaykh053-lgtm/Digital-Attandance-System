const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/register
// @desc    Register a new user (Student/Faculty)
// @access  Public
router.post('/register', authController.register);

// @route   GET /api/auth/departments
// @desc    Get list of departments for registration
// @access  Public
router.get('/departments', authController.getPublicDepartments);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
