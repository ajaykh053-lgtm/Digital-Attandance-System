const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const studentsData = [
  { roll: 'B 1', usn: '3VC24CS006', name: 'AJAY K H' },
  { roll: 'B 2', usn: '3VC24CS007', name: 'AKSHAY G' },
  { roll: 'B 3', usn: '3VC24CS008', name: 'AKSHAY KUMAR M' },
  { roll: 'B 4', usn: '3VC24CS009', name: 'ALIYA TABASSUM' },
  { roll: 'B 5', usn: '3VC24CS010', name: 'AMARANATHA H' },
  { roll: 'B 6', usn: '3VC24CS018', name: 'B KISHOR KUMAR' },
  { roll: 'B 7', usn: '3VC24CS019', name: 'B MAZID MAQBUL' },
  { roll: 'B 8', usn: '3VC24CS020', name: 'B RAMYA' },
  { roll: 'B 9', usn: '3VC24CS022', name: 'B VEERESHA' },
  { roll: 'B 10', usn: '3VC24CS023', name: 'BASAVARAJ' },
  { roll: 'B 11', usn: '3VC24CS029', name: 'CHAITRA KOTAGI' },
  { roll: 'B 12', usn: '3VC24CS030', name: 'CHANDBEE' },
  { roll: 'B 13', usn: '3VC24CS031', name: 'CHARANJIT PATIL' },
  { roll: 'B 14', usn: '3VC24CS032', name: 'CHINTHANA' },
  { roll: 'B 15', usn: '3VC24CS033', name: 'D BHARGAVA REDDY' },
  { roll: 'B 16', usn: '3VC24CS034', name: 'DARSHAN' },
  { roll: 'B 17', usn: '3VC24CS040', name: 'G H SWAPNA' },
  { roll: 'B 18', usn: '3VC24CS042', name: 'GADILINGA D' },
  { roll: 'B 19', usn: '3VC24CS043', name: 'GANESH G' },
  { roll: 'B 20', usn: '3VC24CS046', name: 'H VISHWAPRASAD' },
  { roll: 'B 21', usn: '3VC24CS050', name: 'K A BHARGAVI' },
  { roll: 'B 22', usn: '3VC24CS052', name: 'K BHASKAR' },
  { roll: 'B 23', usn: '3VC24CS053', name: 'K KEDARANATHA' },
  { roll: 'B 24', usn: '3VC24CS054', name: 'K NANDINI' },
  { roll: 'B 25', usn: '3VC24CS055', name: 'K RADHIKA' },
  { roll: 'B 26', usn: '3VC24CS057', name: 'K V TANUSHREE' },
  { roll: 'B 27', usn: '3VC24CS061', name: 'KAVERI BALI' },
  { roll: 'B 28', usn: '3VC24CS062', name: 'KAVYA D' },
  { roll: 'B 29', usn: '3VC24CS063', name: 'KAVYA K' },
  { roll: 'B 30', usn: '3VC24CS064', name: 'KEERTHANA SHETTY' },
  { roll: 'B 31', usn: '3VC24CS065', name: 'KEERTHI ARALI' },
  { roll: 'B 32', usn: '3VC24CS069', name: 'LAKSHMANA S' },
  { roll: 'B 33', usn: '3VC24CS074', name: 'M P VIJAYAKUMARI' },
  { roll: 'B 34', usn: '3VC24CS076', name: 'MALLIKA' },
  { roll: 'B 35', usn: '3VC24CS078', name: 'MANYA B S' },
  { roll: 'B 36', usn: '3VC24CS079', name: 'MASUL MOHAMMED' },
  { roll: 'B 37', usn: '3VC24CS081', name: 'MEGHAMALA G' },
  { roll: 'B 38', usn: '3VC24CS088', name: 'NAGA GANESH ROHIT' },
  { roll: 'B 39', usn: '3VC24CS089', name: 'NAGENDRA REDDY' },
  { roll: 'B 40', usn: '3VC24CS093', name: 'NORA PURVA' },
  { roll: 'B 41', usn: '3VC24CS094', name: 'P Y RAMEEJA BEGUM' },
  { roll: 'B 42', usn: '3VC24CS101', name: 'R NANDANA GOUDA' },
  { roll: 'B 43', usn: '3VC24CS102', name: 'RACHANA S GHATGE' },
  { roll: 'B 44', usn: '3VC24CS103', name: 'RADHIKA S KALAKAPUR' },
  { roll: 'B 45', usn: '3VC24CS104', name: 'RAJESH B' },
  { roll: 'B 46', usn: '3VC24CS105', name: 'RAKSHITHA V' },
  { roll: 'B 47', usn: '3VC24CS106', name: 'RANJEETA VEERABADRAF' },
  { roll: 'B 48', usn: '3VC24CS113', name: 'S SUMANTH' },
  { roll: 'B 49', usn: '3VC24CS114', name: 'SAGAR B N' },
  { roll: 'B 50', usn: '3VC24CS115', name: 'SAGAR PATIL S' },
  { roll: 'B 51', usn: '3VC24CS118', name: 'SANJANA G M' },
  { roll: 'B 52', usn: '3VC24CS119', name: 'SANJANA J G' },
  { roll: 'B 53', usn: '3VC24CS121', name: 'SANJANA M T' },
  { roll: 'B 54', usn: '3VC24CS126', name: 'SHARANABASAVA' },
  { roll: 'B 55', usn: '3VC24CS134', name: 'SUDHARSHAN A G' },
  { roll: 'B 56', usn: '3VC24CS152', name: 'SANDEEP B' }
];

async function setup() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Cleaning up existing students and attendance...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE attendance_records');
    await db.query('TRUNCATE TABLE attendance_sessions');
    await db.query('DELETE FROM students');
    await db.query('DELETE FROM users WHERE role = "student"');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    const [dept] = await db.query('SELECT id FROM departments WHERE code = "CS" LIMIT 1');
    const deptId = dept[0].id;
    const hashedPassword = await bcrypt.hash('student123', 10);

    console.log(`Importing ${studentsData.length} students...`);
    for (const s of studentsData) {
      const email = `${s.usn.toLowerCase()}@edu.com`;
      const [u] = await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "student")', [s.name, email, hashedPassword]);
      await db.query('INSERT INTO students (user_id, student_code, roll_number, dept_id, year, section) VALUES (?, ?, ?, ?, 3, "B")', [u.insertId, s.usn, s.roll, deptId]);
    }

    console.log('Ensuring faculty have assignments for Section B...');
    const [facs] = await db.query('SELECT id FROM faculty');
    const [subjs] = await db.query('SELECT id FROM subjects WHERE dept_id = ? AND year = 3', [deptId]);
    
    for (const f of facs) {
      for (const s of subjs) {
        await db.query('INSERT IGNORE INTO faculty_subjects (faculty_id, subject_id, section, semester) VALUES (?, ?, "B", "ODD-2024")', [f.id, s.id]);
      }
    }

    console.log('Import and setup complete!');
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

setup();
