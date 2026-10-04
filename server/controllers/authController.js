const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please provide User ID/Email and password.' });
  }

  try {
    // 1. Check if user exists by email, student_code, or faculty_code
    const [users] = await db.execute(`
      SELECT u.*, s.id as student_id, f.id as faculty_id
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN faculty f ON f.user_id = u.id
      WHERE u.email = ? OR s.student_code = ? OR f.faculty_code = ?
    `, [identifier, identifier, identifier]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = users[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 3. Create JWT token
    const payload = {
      id: user.id,
      student_id: user.student_id,
      faculty_id: user.faculty_id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    res.json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};


// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role, phone, student_code, roll_number, faculty_code, dept_id, year, section, designation } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Check if email already exists
    const [existingUsers] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Email already in use.' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert into users table
    const [userResult] = await conn.execute(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone || null]
    );
    const userId = userResult.insertId;

    // 4. Handle role-specific tables
    let finalDeptId = dept_id;
    if (dept_id && isNaN(dept_id)) {
      const [deptRows] = await conn.execute('SELECT id FROM departments WHERE name = ? OR code = ?', [dept_id, dept_id]);
      if (deptRows.length > 0) {
        finalDeptId = deptRows[0].id;
      } else {
        // Try fuzzy match or just fail
        throw new Error(`Department "${dept_id}" not found.`);
      }
    }

    if (role === 'student') {
      if (!student_code || !roll_number || !finalDeptId || !year || !section) {
        throw new Error('Missing student details.');
      }
      await conn.execute(
        'INSERT INTO students (user_id, student_code, roll_number, dept_id, year, section) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, student_code, roll_number, finalDeptId, year, section]
      );
    } else if (role === 'faculty') {
      if (!faculty_code || !finalDeptId) {
        throw new Error('Missing faculty details.');
      }
      await conn.execute(
        'INSERT INTO faculty (user_id, faculty_code, dept_id, designation) VALUES (?, ?, ?, ?)',
        [userId, faculty_code, finalDeptId, designation || 'Assistant Professor']
      );
    }


    await conn.commit();
    res.status(201).json({ message: 'Registration successful. You can now login.' });
  } catch (error) {
    await conn.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during registration.' });
  } finally {
    conn.release();
  }
};

// GET /api/auth/departments (Public)
exports.getPublicDepartments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, code FROM departments ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get public departments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {

  try {
    const [users] = await db.execute(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
