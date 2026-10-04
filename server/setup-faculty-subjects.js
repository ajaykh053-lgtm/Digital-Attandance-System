const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edudbms'
});

async function setupFacultySubjects() {
  try {
    console.log('🔧 Setting up Faculty-Subject Assignments...\n');

    // Get faculty and subjects
    connection.query(`
      SELECT f.id as faculty_id, u.name as faculty_name, f.dept_id
      FROM faculty f
      JOIN users u ON f.user_id = u.id
    `, (err, faculty) => {
      if (err) {
        console.error('Error fetching faculty:', err);
        connection.end();
        return;
      }

      connection.query(`
        SELECT id, name, code, dept_id, year
        FROM subjects
        ORDER BY dept_id, year
      `, (err, subjects) => {
        if (err) {
          console.error('Error fetching subjects:', err);
          connection.end();
          return;
        }

        console.log(`📚 Found ${subjects.length} subjects`);
        console.log(`👨‍🏫 Found ${faculty.length} faculty members\n`);

        if (faculty.length === 0 || subjects.length === 0) {
          console.log('⚠️  Need at least one faculty and one subject!');
          connection.end();
          process.exit(1);
          return;
        }

        // Assign faculty to subjects
        const assignments = [];
        const sections = ['A', 'B', 'C'];
        const semester = 'ODD-2024';

        faculty.forEach((f, fIdx) => {
          // Each faculty gets 2-3 subjects from their department
          subjects
            .filter(s => s.dept_id === f.dept_id)
            .slice(0, 3)
            .forEach((subj, sIdx) => {
              sections.forEach((section, secIdx) => {
                assignments.push({
                  faculty_id: f.faculty_id,
                  subject_id: subj.id,
                  section: section,
                  semester: semester
                });
              });
            });
        });

        console.log(`📝 Creating ${assignments.length} faculty-subject assignments...\n`);

        let added = 0;
        let duplicate = 0;

        assignments.forEach((assign, idx) => {
          const query = `
            INSERT INTO faculty_subjects (faculty_id, subject_id, section, semester)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
          `;

          connection.query(
            query,
            [assign.faculty_id, assign.subject_id, assign.section, assign.semester],
            (err) => {
              if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                  duplicate++;
                } else {
                  console.error(`Error adding assignment:`, err.message);
                }
              } else {
                added++;
              }

              // Show progress every 10 items
              if ((idx + 1) % 10 === 0) {
                console.log(`✓ Processed ${idx + 1}/${assignments.length}`);
              }

              // When done
              if (idx === assignments.length - 1) {
                setTimeout(() => {
                  console.log(`\n✅ Faculty-Subject Setup Complete!`);
                  console.log(`   Assignments Created: ${added}`);
                  console.log(`   Duplicates Skipped: ${duplicate}`);
                  console.log(`   Total: ${added + duplicate}\n`);

                  // Show summary
                  connection.query(`
                    SELECT 
                      u.name as faculty_name,
                      COUNT(DISTINCT fs.subject_id) as subject_count,
                      COUNT(DISTINCT fs.section) as section_count
                    FROM faculty_subjects fs
                    JOIN faculty f ON fs.faculty_id = f.id
                    JOIN users u ON f.user_id = u.id
                    GROUP BY fs.faculty_id
                  `, (err, summary) => {
                    if (err) {
                      console.error('Error fetching summary:', err);
                    } else {
                      console.log('📊 Faculty Assignments Summary:');
                      summary.forEach(row => {
                        console.log(`   ${row.faculty_name}: ${row.subject_count} subjects × ${row.section_count} sections`);
                      });
                    }

                    console.log('\n🎉 Faculty can now mark attendance!\n');
                    connection.end();
                    process.exit(0);
                  });
                }, 500);
              }
            }
          );
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
    console.error('   1. MySQL is running');
    console.error('   2. Database "edudbms" exists');
    console.error('   3. Schema has been imported');
    console.error('   4. setup-sample-data.js has been run');
    process.exit(1);
  }

  console.log('✅ Connected to MySQL database\n');
  setupFacultySubjects();
});
