const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All admin routes require authentication AND the 'admin' role
router.use(verifyToken);
router.use(requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', adminController.getStats);

// GET /api/admin/departments
router.get('/departments', adminController.getDepartments);

// POST /api/admin/students
router.post('/students', adminController.addStudent);

// POST /api/admin/faculty
router.post('/faculty', adminController.addFaculty);

module.exports = router;
