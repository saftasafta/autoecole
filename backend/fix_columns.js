const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Add missing columns if they don't exist
  const columns = [
    "ALTER TABLE vehicles ADD COLUMN last_oil_change_km INTEGER DEFAULT 0",
    "ALTER TABLE vehicles ADD COLUMN oil_interval INTEGER DEFAULT 10000",
    "ALTER TABLE vehicles ADD COLUMN tech_inspection_expiry DATE",
    "ALTER TABLE vehicles ADD COLUMN last_maintenance DATE"
  ];

  columns.forEach(sql => {
    db.run(sql, (err) => {
      if (err) console.log(`Notice: ${sql.split(' ').pop()} might already exist or error:`, err.message);
    });
  });

  console.log('Migration step 2 complete.');
});

db.close();
