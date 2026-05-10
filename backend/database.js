const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dns = require('node:dns');
require('dotenv').config();

// Bypass SSL certificate validation for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Force IPv4 first to avoid connection issues on some networks
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Ensure we don't hang on connection errors
  connectionTimeoutMillis: 5000
});

// Helper to convert SQLite "?" syntax to PostgreSQL "$1, $2" syntax
const convertSql = (sql) => {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
};

// Compatibility wrapper for SQLite-like API
const db = {
  all: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const pgSql = convertSql(sql);
    pool.query(pgSql, params, (err, res) => {
      if (callback) callback(err, res ? res.rows : null);
    });
  },
  get: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const pgSql = convertSql(sql);
    pool.query(pgSql, params, (err, res) => {
      if (callback) callback(err, res ? res.rows[0] : null);
    });
  },
  run: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const pgSql = convertSql(sql);
    pool.query(pgSql, params, (err, res) => {
      if (callback) {
        const context = {
          lastID: res?.rows?.[0]?.id || null,
          changes: res?.rowCount || 0
        };
        callback.call(context, err);
      }
    });
  },
  serialize: (fn) => fn(),
  close: () => pool.end()
};

// Initialize Tables (PostgreSQL Syntax)
const initDb = async () => {
  try {
    const client = await pool.connect();
    
    // 1. Tariffs
    await client.query(`CREATE TABLE IF NOT EXISTS tariffs (
      id SERIAL PRIMARY KEY,
      code_hour_price DECIMAL(10,2) NOT NULL,
      driving_hour_price DECIMAL(10,2) NOT NULL,
      exam_code_price DECIMAL(10,2) NOT NULL,
      exam_driving_price DECIMAL(10,2) NOT NULL,
      exam_parking_price DECIMAL(10,2) NOT NULL
    )`);

    // 2. Users
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'instructor')),
      phone TEXT
    )`);

    // 3. Students
    await client.query(`CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      cin TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`);

    // 4. Instructors
    await client.query(`CREATE TABLE IF NOT EXISTS instructors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      mission TEXT
    )`);

    // 5. Vehicles
    await client.query(`CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      model TEXT NOT NULL,
      registration_plate TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'maintenance')),
      insurance_expiry DATE,
      tech_inspection_expiry DATE,
      last_oil_change_km INTEGER DEFAULT 0,
      oil_interval INTEGER DEFAULT 10000,
      last_maintenance DATE,
      mileage INTEGER DEFAULT 0
    )`);

    // 6. Vehicle Expenses
    await client.query(`CREATE TABLE IF NOT EXISTS vehicle_expenses (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Fuel', 'Repair', 'Insurance', 'Tax', 'Other')),
      date DATE DEFAULT CURRENT_DATE,
      description TEXT
    )`);

    // 7. General Expenses
    await client.query(`CREATE TABLE IF NOT EXISTS general_expenses (
      id SERIAL PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      category TEXT NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      description TEXT
    )`);

    // 8. Vehicle Daily Logs
    await client.query(`CREATE TABLE IF NOT EXISTS vehicle_daily_logs (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
      date DATE DEFAULT CURRENT_DATE,
      start_km INTEGER,
      end_km INTEGER,
      notes TEXT
    )`);

    // 9. Sessions
    await client.query(`CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      duration_hours DECIMAL(5,2) DEFAULT 1,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
      result TEXT CHECK(result IN ('pass', 'fail', null))
    )`);

    // 10. Payments
    await client.query(`CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      payment_type TEXT DEFAULT 'Autre',
      payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`);

    // Default Admin
    const res = await client.query("SELECT * FROM users WHERE email = 'admin@autoecole.com'");
    if (res.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`, 
        ['Admin', 'admin@autoecole.com', hash, 'admin']);
      console.log('Default admin created in Supabase');
    }

    client.release();
    console.log('Cloud database initialized successfully.');

    // Initialize Tariffs if empty
    db.get('SELECT COUNT(*) as count FROM tariffs', [], (err, row) => {
      if (!err && (parseInt(row.count) === 0)) {
        db.run('INSERT INTO tariffs (code_hour_price, driving_hour_price, exam_code_price, exam_driving_price, exam_parking_price) VALUES (?, ?, ?, ?, ?)', 
          [0, 0, 0, 0, 0]);
      }
    });
  } catch (err) {
    console.error('Error initializing cloud database:', err);
  }
};

initDb();

module.exports = db;
