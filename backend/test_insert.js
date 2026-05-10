const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing direct insert into general_expenses...');
db.run('INSERT INTO general_expenses (amount, category, date, description) VALUES (?, ?, ?, ?)',
  [50, 'Test', '2026-05-07', 'Direct script test'], function(err) {
    if (err) {
      console.error('INSERT ERROR:', err.message);
    } else {
      console.log('INSERT SUCCESS. LastID:', this.lastID);
      db.all('SELECT * FROM general_expenses', (err, rows) => {
        console.log('All general_expenses:', rows);
        db.close();
      });
    }
});
