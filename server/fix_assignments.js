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
    const [subjs] = await db.query('SELECT id FROM subjects');
    
    console.log(`Found ${facs.length} faculty and ${subjs.length} subjects.`);
    
    for (const f of facs) {
      console.log(`Assigning to faculty ID: ${f.id}`);
      for (const s of subjs) {
        await db.query('INSERT IGNORE INTO faculty_subjects (faculty_id, subject_id, section, semester) VALUES (?, ?, "A", "ODD-2024")', [f.id, s.id]);
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
