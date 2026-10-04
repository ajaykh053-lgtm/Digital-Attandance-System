const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edudbms'
});

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function setupSampleData() {
  try {
    console.log('🌱 Adding Sample Faculty and Student Data...\n');

    // Sample Faculty Data
    const facultyData = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@eduattend.com',
        password: 'faculty@123',
        faculty_code: 'FAC001',
        dept_name: 'Computer Science and Engineering',
        designation: 'Professor'
      },
      {
        name: 'Prof. Priya Singh',
        email: 'priya.singh@eduattend.com',
        password: 'faculty@123',
        faculty_code: 'FAC002',
        dept_name: 'Computer Science and Engineering',
        designation: 'Associate Professor'
      },
      {
        name: 'Dr. Amit Patel',
        email: 'amit.patel@eduattend.com',
        password: 'faculty@123',
        faculty_code: 'FAC003',
        dept_name: 'Electronics and Communication Engineering',
        designation: 'Assistant Professor'
      }
    ];

    // Sample Student Data
    const studentData = [
      {
        name: 'Arjun Singh',
        email: 'arjun.singh@student.eduattend.com',
        password: 'student@123',
        student_code: 'STU2024001',
        roll_number: '24CS001',
        dept_name: 'Computer Science and Engineering',
        year: 1,
        section: 'A'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@student.eduattend.com',
        password: 'student@123',
        student_code: 'STU2024002',
        roll_number: '24CS002',
        dept_name: 'Computer Science and Engineering',
        year: 1,
        section: 'A'
      },
      {
        name: 'Nikhil Desai',
        email: 'nikhil.desai@student.eduattend.com',
        password: 'student@123',
        student_code: 'STU2024003',
        roll_number: '24CS003',
        dept_name: 'Computer Science and Engineering',
        year: 1,
        section: 'B'
      },
      {
        name: 'Ananya Gupta',
        email: 'ananya.gupta@student.eduattend.com',
        password: 'student@123',
        student_code: 'STU2024004',
        roll_number: '24ECE001',
        dept_name: 'Electronics and Communication Engineering',
        year: 2,
        section: 'A'
      },
      {
        name: 'Rohan Verma',
        email: 'rohan.verma@student.eduattend.com',
        password: 'student@123',
        student_code: 'STU2024005',
        roll_number: '24ECE002',
        dept_name: 'Electronics and Communication Engineering',
        year: 2,
        section: 'A'
      }
    ];

    // Get all departments
    connection.query('SELECT id, name FROM departments', async (err, depts) => {
      if (err) {
        console.error('❌ Error fetching departments:', err);
        connection.end();
        return;
      }

      const deptMap = {};
      depts.forEach(d => deptMap[d.name] = d.id);

      console.log('📚 Found Departments:');
      Object.keys(deptMap).forEach(name => {
        console.log(`   ✓ ${name}`);
      });
      console.log();

      // Add Faculty
      console.log('👨‍🏫 Adding Faculty Members:\n');
      let facultyAdded = 0;

      for (const faculty of facultyData) {
        const hashedPassword = await hashPassword(faculty.password);
        const deptId = deptMap[faculty.dept_name];

        const query = `
          INSERT INTO users (name, email, password, role, phone) 
          VALUES (?, ?, ?, 'faculty', NULL)
          ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
        `;

        await new Promise((resolve) => {
          connection.query(query, [faculty.name, faculty.email, hashedPassword], (err, results) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                console.log(`   ⚠️  ${faculty.name} (${faculty.email}) - Already exists`);
                resolve();
                return;
              }
              console.error(`   ❌ Error adding ${faculty.name}:`, err.message);
              resolve();
              return;
            }

            const userId = results.insertId;

            const facultyQuery = `
              INSERT INTO faculty (user_id, faculty_code, dept_id, designation)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)
            `;

            connection.query(
              facultyQuery,
              [userId, faculty.faculty_code, deptId, faculty.designation],
              (err) => {
                if (err) {
                  console.error(`   ❌ Error adding faculty record:`, err.message);
                } else {
                  console.log(`   ✅ ${faculty.name} (${faculty.email})`);
                  facultyAdded++;
                }
                resolve();
              }
            );
          });
        });
      }

      console.log(`\n📊 Faculty Added: ${facultyAdded}/${facultyData.length}\n`);

      // Add Students
      console.log('👨‍🎓 Adding Students:\n');
      let studentAdded = 0;

      for (const student of studentData) {
        const hashedPassword = await hashPassword(student.password);
        const deptId = deptMap[student.dept_name];

        const query = `
          INSERT INTO users (name, email, password, role, phone) 
          VALUES (?, ?, ?, 'student', NULL)
          ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
        `;

        await new Promise((resolve) => {
          connection.query(query, [student.name, student.email, hashedPassword], (err, results) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                console.log(`   ⚠️  ${student.name} (${student.email}) - Already exists`);
                resolve();
                return;
              }
              console.error(`   ❌ Error adding ${student.name}:`, err.message);
              resolve();
              return;
            }

            const userId = results.insertId;

            const studentQuery = `
              INSERT INTO students (user_id, student_code, roll_number, dept_id, year, section)
              VALUES (?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)
            `;

            connection.query(
              studentQuery,
              [userId, student.student_code, student.roll_number, deptId, student.year, student.section],
              (err) => {
                if (err) {
                  console.error(`   ❌ Error adding student record:`, err.message);
                } else {
                  console.log(`   ✅ ${student.name} (Roll: ${student.roll_number})`);
                  studentAdded++;
                }
                resolve();
              }
            );
          });
        });
      }

      console.log(`\n📊 Students Added: ${studentAdded}/${studentData.length}\n`);

      // Summary
      connection.query('SELECT COUNT(*) as count FROM users', (err, results) => {
        console.log('📈 Database Summary:');
        console.log(`   Total Users: ${results[0].count}`);

        connection.query('SELECT COUNT(*) as count FROM faculty', (err, results) => {
          console.log(`   Faculty Members: ${results[0].count}`);

          connection.query('SELECT COUNT(*) as count FROM students', (err, results) => {
            console.log(`   Students: ${results[0].count}`);
            console.log('\n✅ Sample data setup complete!\n');
            connection.end();
            process.exit(0);
          });
        });
      });
    });
  } catch (error) {
    console.error('❌ Setup error:', error);
    connection.end();
    process.exit(1);
  }
}

// Test connection
connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err.message);
    console.error('\n⚠️  Make sure:');
    console.error('   1. MySQL is running in XAMPP');
    console.error('   2. Database "edudbms" exists');
    console.error('   3. Admin has been setup (run setup-admin.js first)');
    process.exit(1);
  }

  console.log('✅ Connected to MySQL database\n');
  setupSampleData();
});
