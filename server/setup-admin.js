const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
require('dotenv').config();

// Database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edudbms'
});

async function setupAdminAccount() {
  try {
    console.log('🔧 Setting up Admin Account...\n');

    // Generate bcrypt hash for password
    const password = 'admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('📝 Admin Credentials:');
    console.log('   Email: admin@eduattend.com');
    console.log('   Password: admin@123');
    console.log('   Role: admin\n');

    // Insert admin user
    const adminQuery = `
      INSERT INTO users (name, email, password, role, phone) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password=VALUES(password)
    `;

    connection.query(
      adminQuery,
      ['Administrator', 'admin@eduattend.com', hashedPassword, 'admin', '+91-9999999999'],
      (err, results) => {
        if (err) {
          console.error('❌ Error creating admin user:', err.message);
          connection.end();
          process.exit(1);
          return;
        }

        console.log('✅ Admin user created successfully!\n');
        console.log('📌 You can now login with:');
        console.log('   Email: admin@eduattend.com');
        console.log('   Password: admin@123\n');

        // Check if departments exist
        connection.query('SELECT COUNT(*) as count FROM departments', (err, results) => {
          if (err) {
            console.error('Error checking departments:', err);
          } else {
            console.log(`📊 Database Status:`);
            console.log(`   Departments: ${results[0].count} found`);
          }

          // Check users count
          connection.query('SELECT COUNT(*) as count FROM users', (err, results) => {
            if (err) {
              console.error('Error checking users:', err);
            } else {
              console.log(`   Users: ${results[0].count} total`);
            }

            console.log('\n🎉 Admin setup complete! You can now login and add faculty/students.\n');
            connection.end();
            process.exit(0);
          });
        });
      }
    );
  } catch (error) {
    console.error('❌ Setup error:', error);
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
    console.error('   3. Database schema has been imported');
    process.exit(1);
  }

  console.log('✅ Connected to MySQL database\n');
  setupAdminAccount();
});
