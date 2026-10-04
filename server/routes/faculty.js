const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All faculty routes require authentication AND the 'faculty' role
// All faculty routes require authentication
router.use(verifyToken);

// GET /api/faculty - Allow admin and faculty to see list
router.get('/', requireRole('admin', 'faculty'), facultyController.getAllFaculty);

// Specific faculty-only routes
router.get('/stats', requireRole('faculty'), facultyController.getStats);
router.post('/students', requireRole('faculty'), facultyController.addStudent);

module.exports = router;
