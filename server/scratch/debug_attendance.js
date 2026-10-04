const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [viewRows] = await db.query('SELECT * FROM v_student_attendance LIMIT 10');
    console.log('VIEW DATA:', JSON.stringify(viewRows, null, 2));

    const [statsRows] = await db.query(`
      SELECT student_id, SUM(conducted) as total_conducted, SUM(attended) as total_attended
      FROM v_student_attendance
      GROUP BY student_id
    `);
    console.log('STATS SUMMARY:', JSON.stringify(statsRows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}
check();
