const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Check existing columns
  db.all("PRAGMA table_info(vehicles)", [], (err, cols) => {
    if (err) { console.error(err.message); return; }
    const existing = cols.map(c => c.name);
    console.log('Existing columns:', existing.join(', '));

    const toAdd = [
      { name: 'mileage',                default: '0',     type: 'INTEGER' },
      { name: 'last_oil_change_km',     default: '0',     type: 'INTEGER' },
      { name: 'oil_interval',           default: '10000', type: 'INTEGER' },
      { name: 'insurance_expiry',       default: 'NULL',  type: 'DATE'    },
      { name: 'tech_inspection_expiry', default: 'NULL',  type: 'DATE'    },
      { name: 'last_maintenance',       default: 'NULL',  type: 'DATE'    },
    ];

    let pending = 0;
    toAdd.forEach(col => {
      if (!existing.includes(col.name)) {
        pending++;
        db.run(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`, (err) => {
          if (err) console.error(`Failed to add ${col.name}:`, err.message);
          else console.log(`Added column: ${col.name}`);
          pending--;
          if (pending === 0) {
            console.log('All missing columns added!');
            db.close();
          }
        });
      } else {
        console.log(`Column already exists: ${col.name}`);
      }
    });

    if (pending === 0) {
      console.log('No columns to add - table is already up to date.');
      db.close();
    }
  });
});
