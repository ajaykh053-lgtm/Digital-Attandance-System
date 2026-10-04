const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function purgeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edudbms'
  });

  try {
    console.log('Purging database (keeping Admin and Departments)...');

    // 1. Clear records (Order matters for foreign keys)
    await connection.execute('DELETE FROM attendance_records');
    await connection.execute('DELETE FROM attendance_sessions');
    await connection.execute('DELETE FROM faculty_subjects');
    await connection.execute('DELETE FROM subjects');
    await connection.execute('DELETE FROM faculty');
    await connection.execute('DELETE FROM students');

    // 2. Clear users EXCEPT our admin
    const adminEmail = 'ajaykh053@gmail.com';
    await connection.execute('DELETE FROM users WHERE email != ?', [adminEmail]);

    // Note: We KEEP departments as requested earlier (needed for registration)

    console.log('Database purged successfully!');
    console.log('Only Admin "ajaykh053@gmail.com" and Departments remain.');
  } catch (error) {
    console.error('Error purging database:', error);
  } finally {
    await connection.end();
  }
}

purgeDatabase();
