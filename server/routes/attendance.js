const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.use((req, res, next) => {
  console.log(`[ATTENDANCE ROUTER] ${req.method} ${req.url}`);
  next();
});

// POST /api/attendance/session
// Only faculty and admins can mark attendance
router.post('/session', requireRole('admin', 'faculty'), attendanceController.submitAttendance);

// GET /api/attendance/faculty-subjects
router.get('/faculty/subjects', requireRole('admin', 'faculty'), attendanceController.getFacultySubjects);
router.get('/faculty/sections', requireRole('admin', 'faculty'), attendanceController.getSubjectSections);
router.get('/class/students', requireRole('admin', 'faculty'), attendanceController.getStudentsForClass);

// GET /api/attendance/report
router.get('/report', attendanceController.getReport);

module.exports = router;
