const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function updateDepts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edudbms'
  });

  try {
    console.log('Updating department codes to match frontend...');
    await connection.execute('UPDATE departments SET code = "CS" WHERE code = "CSE"');
    await connection.execute('UPDATE departments SET code = "EEE" WHERE code = "EE"');
    console.log('Department codes updated successfully!');
  } catch (error) {
    console.error('Error updating depts:', error);
  } finally {
    await connection.end();
  }
}

updateDepts();
