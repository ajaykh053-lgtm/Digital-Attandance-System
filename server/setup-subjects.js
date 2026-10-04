const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edudbms'
});

const subjects = [
  // CSE (dept_id 1)
  { name: 'Data Structures', code: 'CS301', dept_code: 'CSE', year: 3 },
  { name: 'Algorithms', code: 'CS302', dept_code: 'CSE', year: 3 },
  { name: 'Database Systems', code: 'CS303', dept_code: 'CSE', year: 3 },
  { name: 'Operating Systems', code: 'CS304', dept_code: 'CSE', year: 3 },

  // ECE (dept_id 2)
  { name: 'Digital Signal Processing', code: 'EC301', dept_code: 'ECE', year: 3 },
  { name: 'Digital Systems', code: 'EC302', dept_code: 'ECE', year: 3 },

  // ME (dept_id 3)
  { name: 'Thermodynamics', code: 'ME301', dept_code: 'ME', year: 3 },

  // CE (dept_id 4)
  { name: 'Structural Analysis', code: 'CE301', dept_code: 'CE', year: 3 },

  // EE (dept_id 5)
  { name: 'Power Systems', code: 'EE301', dept_code: 'EE', year: 3 },

  // IT (dept_id 6)
  { name: 'Web Technologies', code: 'IT301', dept_code: 'IT', year: 3 }
];

function seedSubjects() {
  connection.query('SELECT id, code FROM departments', (err, depts) => {
    if (err) {
      console.error('Error fetching departments:', err);
      connection.end();
      process.exit(1);
    }

    const deptMap = {};
    depts.forEach(d => deptMap[d.code] = d.id);

    let added = 0;
    let skipped = 0;

    subjects.forEach((s, idx) => {
      const deptId = deptMap[s.dept_code];
      if (!deptId) {
        console.warn(`Skipping subject ${s.code} - department ${s.dept_code} not found`);
        skipped++;
        if (idx === subjects.length - 1) finish();
        return;
      }

      const query = `INSERT INTO subjects (name, code, dept_id, year) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`;
      connection.query(query, [s.name, s.code, deptId, s.year], (err) => {
        if (err) {
          console.error(`Error inserting ${s.code}:`, err.message);
        } else {
          added++;
        }

        if (idx === subjects.length - 1) finish();
      });
    });

    function finish() {
      console.log(`\n✅ Subjects seeding complete. Added: ${added}, Skipped: ${skipped}`);
      connection.end();
      process.exit(0);
    }
  });
}

connection.connect(err => {
  if (err) {
    console.error('MySQL connect error:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL. Seeding subjects...');
  seedSubjects();
});