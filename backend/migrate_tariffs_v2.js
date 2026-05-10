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
      // Add code_hour_price to tariffs
      db.run("ALTER TABLE tariffs ADD COLUMN code_hour_price REAL DEFAULT 15", (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('Column code_hour_price already exists');
          } else {
            console.error('Error adding column code_hour_price', err.message);
          }
        } else {
          console.log('Added code_hour_price to tariffs table');
        }
      });

      // Update existing tariffs to have a default if not set
      db.run("UPDATE tariffs SET code_hour_price = 15 WHERE code_hour_price IS NULL");
    });
  }
});
