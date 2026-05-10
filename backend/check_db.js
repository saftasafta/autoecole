const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) console.error(err);
  console.log('Tables:', rows.map(r => r.name));
  
  db.all("PRAGMA table_info(general_expenses)", (err, columns) => {
    if (err) console.error(err);
    console.log('general_expenses columns:', columns.map(c => c.name));
    db.close();
  });
});
