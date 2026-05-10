const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Show all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) { console.error('Error:', err.message); return; }
    console.log('Tables found:', rows.map(r => r.name).join(', '));
  });

  // Create vehicles table if missing
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    registration_plate TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    insurance_expiry DATE,
    tech_inspection_expiry DATE,
    last_oil_change_km INTEGER DEFAULT 0,
    oil_interval INTEGER DEFAULT 10000,
    last_maintenance DATE,
    mileage INTEGER DEFAULT 0
  )`, (err) => {
    if (err) console.error('vehicles error:', err.message);
    else console.log('vehicles table OK');
  });

  // Create vehicle_expenses table if missing
  db.run(`CREATE TABLE IF NOT EXISTS vehicle_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date DATE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`, (err) => {
    if (err) console.error('vehicle_expenses error:', err.message);
    else console.log('vehicle_expenses table OK');
  });

  // Create vehicle_daily_logs table if missing
  db.run(`CREATE TABLE IF NOT EXISTS vehicle_daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    start_km INTEGER,
    end_km INTEGER,
    notes TEXT,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`, (err) => {
    if (err) console.error('vehicle_daily_logs error:', err.message);
    else console.log('vehicle_daily_logs table OK');
  });

  // Count vehicles
  db.get('SELECT COUNT(*) as count FROM vehicles', [], (err, row) => {
    if (err) console.error('Count error:', err.message);
    else console.log('Total vehicles in DB:', row.count);
    db.close();
  });
});
