const db = require('../config/db');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics for the admin dashboard
exports.getStats = async (req, res) => {
  try {
    const [studentCount] = await db.query('SELECT COUNT(*) as count FROM students');
    const [facultyCount] = await db.query('SELECT COUNT(*) as count FROM faculty');
    const [deptCount] = await db.query('SELECT COUNT(*) as count FROM departments');

    // Get average attendance from v_dept_attendance view
    const [avgAtt] = await db.query('SELECT AVG(avg_attendance) as avg FROM v_dept_attendance');

    res.json({
      total_students: studentCount[0].count,
      total_faculty: facultyCount[0].count,
      total_departments: deptCount[0].count,
      average_attendance: Math.round(avgAtt[0].avg || 0)
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
};

// @route   GET /api/admin/departments
// @desc    Get department attendance stats
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM v_dept_attendance');
    res.json(rows);
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ error: 'Server error fetching department stats' });
  }
};

// @route   POST /api/admin/students
// @desc    Admin manually adding a student
exports.addStudent = async (req, res) => {
  const { name, email, password, student_code, roll_number, dept_id, year, section, phone } = req.body;
  const bcrypt = require('bcryptjs');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error('Email already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'student123', salt);

    // Resolve dept_id if it's a code (like 'CSE') instead of an ID
    let finalDeptId = dept_id;
    if (dept_id && isNaN(dept_id)) {
      const [deptRows] = await conn.execute('SELECT id FROM departments WHERE name = ? OR code = ?', [dept_id, dept_id]);
      if (deptRows.length > 0) finalDeptId = deptRows[0].id;
      else throw new Error(`Department "${dept_id}" not found.`);
    }

    const [uResult] = await conn.execute(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, "student", ?)',
      [name, email, hashedPassword, phone || null]
    );

    await conn.execute(
      'INSERT INTO students (user_id, student_code, roll_number, dept_id, year, section) VALUES (?, ?, ?, ?, ?, ?)',
      [uResult.insertId, student_code, roll_number, finalDeptId, year, section]
    );

    await conn.commit();
    res.status(201).json({ message: 'Student added successfully' });
  } catch (error) {
    await conn.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    conn.release();
  }
};

// @route   POST /api/admin/faculty
// @desc    Admin manually adding a faculty member
exports.addFaculty = async (req, res) => {
  const { name, email, password, faculty_code, dept_id, designation, phone } = req.body;
  const bcrypt = require('bcryptjs');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error('Email already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'faculty123', salt);

    // Resolve dept_id
    let finalDeptId = dept_id;
    if (dept_id && isNaN(dept_id)) {
      const [deptRows] = await conn.execute('SELECT id FROM departments WHERE name = ? OR code = ?', [dept_id, dept_id]);
      if (deptRows.length > 0) finalDeptId = deptRows[0].id;
      else throw new Error(`Department "${dept_id}" not found.`);
    }

    const [uResult] = await conn.execute(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, "faculty", ?)',
      [name, email, hashedPassword, phone || null]
    );

    await conn.execute(
      'INSERT INTO faculty (user_id, faculty_code, dept_id, designation) VALUES (?, ?, ?, ?)',
      [uResult.insertId, faculty_code, finalDeptId, designation || 'Assistant Professor']
    );

    await conn.commit();
    res.status(201).json({ message: 'Faculty member added successfully' });
  } catch (error) {
    await conn.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    conn.release();
  }
};
