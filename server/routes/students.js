const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// GET /api/students
router.get('/', requireRole('admin', 'faculty'), studentController.getAllStudents);

// GET /api/students/:id
router.get('/:id', studentController.getStudentById);

// GET /api/students/me/stats
router.get('/me/stats', requireRole('student'), studentController.getStudentStats);

// GET /api/students/me/attendance
router.get('/me/attendance', requireRole('student'), studentController.getMyAttendance);

// GET /api/students/me/history
router.get('/me/history', requireRole('student'), studentController.getMyHistory);

// GET /api/students/:id/attendance
router.get('/:id/attendance', studentController.getStudentAttendance);

module.exports = router;
