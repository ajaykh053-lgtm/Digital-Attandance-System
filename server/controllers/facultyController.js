const db = require('../config/db');
const bcrypt = require('bcryptjs');

// @route   POST /api/faculty/students
// @desc    Faculty manually adding a student (requested feature)
exports.addStudent = async (req, res) => {
  const { name, email, password, student_code, roll_number, dept_id, year, section, phone } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error('Email already exists');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'student123', salt);

    // Resolve dept_id
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

// @route   GET /api/faculty/stats
exports.getStats = async (req, res) => {
  try {
    const [faculty] = await db.query('SELECT id FROM faculty WHERE user_id = ?', [req.user.id]);
    if (faculty.length === 0) return res.status(403).json({ error: 'Faculty profile not found' });
    const facultyId = faculty[0].id;

    const [subjCount] = await db.query('SELECT COUNT(*) as count FROM faculty_subjects WHERE faculty_id = ?', [facultyId]);
    const [stuCount] = await db.query(`
      SELECT COUNT(DISTINCT s.id) as count
      FROM students s
      JOIN subjects sub ON s.dept_id = sub.dept_id AND s.year = sub.year
      JOIN faculty_subjects fs ON fs.subject_id = sub.id AND fs.section = s.section
      WHERE fs.faculty_id = ?
    `, [facultyId]);

    const [avgAtt] = await db.query(`
      SELECT AVG(avg_attendance) as avg
      FROM v_dept_attendance vda
      JOIN departments d ON vda.dept_name = d.name
      JOIN subjects sub ON sub.dept_id = d.id
      JOIN faculty_subjects fs ON fs.subject_id = sub.id
      WHERE fs.faculty_id = ?
    `, [facultyId]);

    res.json({
      total_students: stuCount[0].count,
      avg_attendance: Math.round(avgAtt[0].avg || 0),
      subjects: subjCount[0].count,
      low_attendance: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllFaculty = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, u.name, u.email, d.name as dept_name 
      FROM faculty f 
      JOIN users u ON f.user_id = u.id 
      JOIN departments d ON f.dept_id = d.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
