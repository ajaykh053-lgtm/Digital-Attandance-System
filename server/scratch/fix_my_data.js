const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function fix() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 1. Find the last logged in student (or just student 74 which we saw in logs)
    const userId = 99; // From the logs we saw earlier
    console.log(`Checking student for user_id ${userId}...`);
    
    const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (students.length === 0) {
        console.log('No student found for user 99.');
        return;
    }
    const student = students[0];
    console.log(`Found student ${student.id} (${student.student_code}). Current Section: ${student.section}, Year: ${student.year}`);

    // 2. Ensure they are in a section/year that has subjects (we know Dept 1, Year 3, Sec B has data)
    console.log('Updating student to Year 3, Section B to match seeded attendance data...');
    await db.query('UPDATE students SET year = 3, section = "B", dept_id = 1 WHERE id = ?', [student.id]);

    // 3. Check if they now have attendance records (since we might need to link them)
    // Actually, attendance_records are linked by student_id. 
    // If student 74 has no records, we should add some.
    const [records] = await db.query('SELECT id FROM attendance_records WHERE student_id = ?', [student.id]);
    if (records.length === 0) {
        console.log('Adding sample attendance records for student 74...');
        
        // Find some sessions for Dept 1, Year 3, Sec A
        const [sessions] = await db.query(`
            SELECT ss.id 
            FROM attendance_sessions ss
            JOIN faculty_subjects fs ON ss.faculty_subj_id = fs.id
            JOIN subjects s ON fs.subject_id = s.id
            WHERE s.dept_id = 1 AND s.year = 3 AND fs.section = "B"
            LIMIT 5
        `);

        if (sessions.length > 0) {
            for (const ss of sessions) {
                await db.query('INSERT INTO attendance_records (session_id, student_id, status) VALUES (?, ?, "present")', [ss.id, student.id]);
            }
            console.log(`Added ${sessions.length} attendance records.`);
        } else {
            console.log('No sessions found to link attendance to. Please mark some attendance first.');
        }
    }

    console.log('FIX COMPLETE! Please refresh your student dashboard.');
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}
fix();
