const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Add maintenance columns to vehicles if they don't exist
  db.run("ALTER TABLE vehicles ADD COLUMN last_oil_change_km INTEGER DEFAULT 0", (err) => {
    if (err) console.log('last_oil_change_km already exists or error:', err.message);
  });
  db.run("ALTER TABLE vehicles ADD COLUMN oil_interval INTEGER DEFAULT 10000", (err) => {
    if (err) console.log('oil_interval already exists or error:', err.message);
  });
  db.run("ALTER TABLE vehicles ADD COLUMN tech_inspection_expiry DATE", (err) => {
    if (err) console.log('tech_inspection_expiry already exists or error:', err.message);
  });
  // insurance_expiry already exists in database.js, but let's be sure
  db.run("ALTER TABLE vehicles ADD COLUMN insurance_expiry DATE", (err) => {
    if (err) console.log('insurance_expiry already exists or error:', err.message);
  });

  // 2. Create vehicle_daily_logs table
  db.run(`CREATE TABLE IF NOT EXISTS vehicle_daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    start_km INTEGER,
    end_km INTEGER,
    notes TEXT,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  // 3. Create general_expenses table
  db.run(`CREATE TABLE IF NOT EXISTS general_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT
  )`);

  console.log('Migration complete: Vehicles updated, Daily Logs and General Expenses tables created.');
});

db.close();
