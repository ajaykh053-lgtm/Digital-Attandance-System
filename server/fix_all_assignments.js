const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fix() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [facs] = await db.query('SELECT id FROM faculty');
    const [subjs] = await db.query('SELECT id FROM subjects WHERE dept_id = 1 AND year = 3');

    console.log(`Assigning ${subjs.length} subjects to ${facs.length} faculty members...`);

    for (const f of facs) {
      for (const s of subjs) {
        // Assign both Section A and Section B
        await db.query('INSERT IGNORE INTO faculty_subjects (faculty_id, subject_id, section, semester) VALUES (?, ?, "A", "ODD-2024")', [f.id, s.id]);
        await db.query('INSERT IGNORE INTO faculty_subjects (faculty_id, subject_id, section, semester) VALUES (?, ?, "B", "ODD-2024")', [f.id, s.id]);
      }
    }
    console.log('Assignments fixed!');
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

fix();
