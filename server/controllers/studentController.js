const db = require('../config/db');

// @route   GET /api/students
// @desc    Get all students (with optional filters)
exports.getAllStudents = async (req, res) => {
  try {
    const { dept, year, section, name } = req.query;

    let query = `
      SELECT s.id, u.name, u.email, s.student_code, s.roll_number, 
             d.name as dept_name, d.code as dept_code, s.year, s.section 
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.dept_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      query += ` AND u.name LIKE ?`;
      params.push(`%${name}%`);
    }
    if (dept) {
      query += ` AND d.id = ?`;
      params.push(dept);
    }
    if (year) {
      query += ` AND s.year = ?`;
      params.push(year);
    }
    if (section) {
      query += ` AND s.section = ?`;
      params.push(section);
    }

    const [students] = await db.query(query, params);

    // For each student, get attendance % using the view
    const [attendanceRows] = await db.query(`
      SELECT student_id, SUM(conducted) as total_conducted, SUM(attended) as total_attended
      FROM v_student_attendance
      GROUP BY student_id
    `);

    // Map attendance data
    const attMap = {};
    attendanceRows.forEach(r => {
      attMap[r.student_id] = r.total_conducted > 0
        ? Math.round((r.total_attended / r.total_conducted) * 100)
        : 0;
    });

    const result = students.map(s => ({
      ...s,
      attendance_pct: attMap[s.id] || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error fetching students' });
  }
};

// @route   GET /api/students/:id
// @desc    Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.id, u.name, u.email, u.phone, s.student_code, s.roll_number, 
             d.name as dept_name, d.code as dept_code, s.year, s.section 
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN departments d ON s.dept_id = d.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(students[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Server error fetching student' });
  }
};

// @route   GET /api/students/:id/attendance
// @desc    Get detailed subject-wise attendance for a student
exports.getStudentAttendance = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT subject_code, subject_name, conducted, attended, attendance_pct
      FROM v_student_attendance
      WHERE student_id = ?
    `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Server error fetching attendance' });
  }
};

exports.getStudentStats = async (req, res) => {
  try {
    const [student] = await db.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (student.length === 0) return res.status(404).json({ error: 'Student profile not found' });
    const studentId = student[0].id;

    const [rows] = await db.query(`
      SELECT SUM(conducted) as total_conducted, SUM(attended) as total_attended
      FROM v_student_attendance
      WHERE student_id = ?
    `, [studentId]);

    const stats = rows[0];
    const total_conducted = parseInt(stats.total_conducted || 0);
    const total_attended = parseInt(stats.total_attended || 0);
    const absences = total_conducted - total_attended;
    const attendance_pct = total_conducted > 0 ? Math.round((total_attended / total_conducted) * 100) : 0;

    res.json({
      total_conducted,
      total_attended,
      absences,
      attendance_pct
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const [student] = await db.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (student.length === 0) return res.status(404).json({ error: 'Student profile not found' });
    const studentId = student[0].id;

    const [rows] = await db.query(`
      SELECT subject_code, subject_name, conducted, attended, attendance_pct
      FROM v_student_attendance
      WHERE student_id = ?
    `, [studentId]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const [student] = await db.query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (student.length === 0) return res.status(404).json({ error: 'Student profile not found' });
    const studentId = student[0].id;

    const [rows] = await db.query(`
      SELECT ar.status, ss.date
      FROM attendance_records ar
      JOIN attendance_sessions ss ON ar.session_id = ss.id
      WHERE ar.student_id = ?
      ORDER BY ss.date DESC
    `, [studentId]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

