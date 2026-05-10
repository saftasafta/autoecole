const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createAdmin = async () => {
  try {
    const email = 'admin@autoecole.com';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    // Delete existing if any
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    
    // Insert new
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['Admin', email, hash, 'admin']
    );
    
    console.log('✅ Admin user created successfully in Supabase!');
    console.log('Email: admin@autoecole.com');
    console.log('Password: admin123');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
};

createAdmin();
