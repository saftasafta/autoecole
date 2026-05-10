const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  } else {
    console.log('Connected to db for migration');
    
    db.serialize(() => {
      // 1. Add payment_type to payments
      db.run("ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'Autre'", (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('Column payment_type already exists');
          } else {
            console.error('Error adding column payment_type', err.message);
          }
        } else {
          console.log('Added payment_type to payments table');
        }
      });

      // 2. We can't easily alter CHECK constraints in SQLite, so we'll do a table recreation.
      // Rename existing sessions to sessions_old
      db.run("ALTER TABLE sessions RENAME TO sessions_old", (err) => {
        if (err) {
            console.error("Error renaming sessions to sessions_old. Maybe it was already renamed or doesn't exist?", err.message);
        } else {
            console.log("Renamed sessions to sessions_old");
        }
      });

      // Create new sessions table with 'Parking' in type CHECK
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        instructor_id INTEGER,
        vehicle_id INTEGER,
        type TEXT NOT NULL CHECK(type IN ('Code', 'Conduite', 'Parking', 'Examen Code', 'Examen Conduite', 'Examen Parking')),
        duration_hours REAL DEFAULT 1,
        start_time DATETIME NOT NULL,
        status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
        FOREIGN KEY(student_id) REFERENCES students(id),
        FOREIGN KEY(instructor_id) REFERENCES instructors(id),
        FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
      )`, (err) => {
          if (err) {
              console.error("Error creating new sessions table", err.message);
          } else {
              console.log("Created new sessions table with updated CHECK constraint");
          }
      });

      // Copy data from old to new
      db.run(`INSERT INTO sessions (id, student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status)
              SELECT id, student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status FROM sessions_old`, (err) => {
          if (err) {
              console.error("Error copying data to new sessions table", err.message);
          } else {
              console.log("Copied data to new sessions table");
              
              // Drop old table
              db.run("DROP TABLE sessions_old", (err) => {
                  if (err) console.error("Error dropping old sessions table", err.message);
                  else console.log("Dropped sessions_old table");
              });
          }
      });
    });
  }
});
