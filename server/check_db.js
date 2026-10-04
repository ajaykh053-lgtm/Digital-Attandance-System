const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [users] = await db.query('SELECT id, email, role FROM users');
    const [faculty] = await db.query('SELECT * FROM faculty');
    const [fac_subjs] = await db.query('SELECT * FROM faculty_subjects');

    console.log('USERS:', JSON.stringify(users, null, 2));
    console.log('FACULTY:', JSON.stringify(faculty, null, 2));
    console.log('ASSIGNMENTS:', JSON.stringify(fac_subjs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}
check();
