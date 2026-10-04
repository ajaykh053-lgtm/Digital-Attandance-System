const db = require('../config/db');

// @route   POST /api/attendance/session
// @desc    Create a new attendance session and mark records
exports.submitAttendance = async (req, res) => {
  const { faculty_subj_id, date, period, records } = req.body;
  // records format: [ { student_id: 1, status: 'present' }, ... ]

  if (!faculty_subj_id || !date || !period || !records || records.length === 0) {
    return res.status(400).json({ error: 'Missing required fields or records.' });
  }

  // Use a transaction to ensure all records are saved together
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Create the session
    const [sessionResult] = await connection.query(
      'INSERT INTO attendance_sessions (faculty_subj_id, date, period) VALUES (?, ?, ?)',
      [faculty_subj_id, date, period]
    );
    const sessionId = sessionResult.insertId;

    // 2. Insert all student records for this session
    const values = records.map(r => [sessionId, r.student_id, r.status]);
    await connection.query(
      'INSERT INTO attendance_records (session_id, student_id, status) VALUES ?',
      [values]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Attendance submitted successfully',
      session_id: sessionId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit attendance error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Attendance for this date and period is already marked.' });
    }
    res.status(500).json({ error: 'Server error submitting attendance' });
  } finally {
    connection.release();
  }
};

// @route   GET /api/attendance/report
// @desc    Get comprehensive attendance report with optional filters
exports.getReport = async (req, res) => {
  try {
    const { dept, year, subject_code } = req.query;

    // We use the pre-built view v_student_attendance
    let query = `SELECT * FROM v_student_attendance WHERE 1=1`;
    const params = [];

    if (dept) {
      query += ` AND dept = ?`;
      params.push(dept);
    }
    if (year) {
      query += ` AND year = ?`;
      params.push(year);
    }
    if (subject_code) {
      query += ` AND subject_code = ?`;
      params.push(subject_code);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Server error fetching report' });
  }
};

exports.getFacultySubjects = async (req, res) => {
  try {
    let subjects;
    if (req.user.role === 'admin') {
      [subjects] = await db.query(`
        SELECT DISTINCT s.id as subject_id, s.name as subject_name, s.code as subject_code
        FROM subjects s
      `);
    } else {
      const [faculty] = await db.query('SELECT id FROM faculty WHERE user_id = ?', [req.user.id]);
      if (faculty.length === 0) return res.json([]);
      
      const facultyId = faculty[0].id;
      [subjects] = await db.query(`
        SELECT DISTINCT s.id as subject_id, s.name as subject_name, s.code as subject_code
        FROM faculty_subjects fs
        JOIN subjects s ON fs.subject_id = s.id
        WHERE fs.faculty_id = ?
      `, [facultyId]);
    }
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjectSections = async (req, res) => {
  try {
    const { subject_id } = req.query;
    let sections;
    if (req.user.role === 'admin') {
      [sections] = await db.query(`
        SELECT MIN(id) as faculty_subj_id, section
        FROM faculty_subjects
        WHERE subject_id = ?
        GROUP BY section
      `, [subject_id]);
    } else {
      const [faculty] = await db.query('SELECT id FROM faculty WHERE user_id = ?', [req.user.id]);
      if (faculty.length === 0) return res.json([]);
      
      const facultyId = faculty[0].id;
      [sections] = await db.query(`
        SELECT id as faculty_subj_id, section
        FROM faculty_subjects
        WHERE faculty_id = ? AND subject_id = ?
      `, [facultyId, subject_id]);
    }
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentsForClass = async (req, res) => {
  try {
    const { faculty_subj_id } = req.query;
    const [subject] = await db.query(`
      SELECT s.dept_id, s.year, fs.section
      FROM faculty_subjects fs
      JOIN subjects s ON fs.subject_id = s.id
      WHERE fs.id = ?
    `, [faculty_subj_id]);

    if (subject.length === 0) return res.status(404).json({ error: 'Class not found' });

    const { dept_id, year, section } = subject[0];
    const [students] = await db.query(`
      SELECT s.id, u.name, s.roll_number
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.dept_id = ? AND s.year = ? AND s.section = ?
      ORDER BY s.roll_number ASC
    `, [dept_id, year, section]);

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
