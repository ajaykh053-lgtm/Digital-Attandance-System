const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edudbms'
  });

  try {
    const name = 'AJAY';
    const email = 'ajaykh053@gmail.com';
    const password = 'ajaykh053';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin']
    );

    console.log('Admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Admin account already exists.');
    } else {
      console.error('Error creating admin:', error);
    }
  } finally {
    await connection.end();
  }
}

createAdmin();
