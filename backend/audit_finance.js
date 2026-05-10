const db = require('./database');

console.log('--- GENERAL EXPENSES ---');
db.all('SELECT * FROM general_expenses', [], (err, rows) => {
  if (err) console.error(err);
  console.log(JSON.stringify(rows, null, 2));
  
  console.log('\n--- VEHICLE EXPENSES ---');
  db.all('SELECT * FROM vehicle_expenses', [], (err, rows) => {
    if (err) console.error(err);
    console.log(JSON.stringify(rows, null, 2));
    
    console.log('\n--- PAYMENTS ---');
    db.all('SELECT * FROM payments', [], (err, rows) => {
      if (err) console.error(err);
      console.log(JSON.stringify(rows, null, 2));
      // No need to close explicitly as database.js manages the pool
    });
  });
});
