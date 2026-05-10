const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('--- GENERAL EXPENSES ---');
  db.all('SELECT * FROM general_expenses', (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
    
    console.log('\n--- VEHICLE EXPENSES ---');
    db.all('SELECT * FROM vehicle_expenses', (err, rows) => {
      console.log(JSON.stringify(rows, null, 2));
      
      console.log('\n--- PAYMENTS ---');
      db.all('SELECT * FROM payments', (err, rows) => {
        console.log(JSON.stringify(rows, null, 2));
        db.close();
      });
    });
  });
});
