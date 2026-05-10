const db = require('./database');
db.all('SELECT id, email, name, role FROM users', [], (err, rows) => {
  if (err) { console.error(err); return; }
  console.log('Users in database:');
  console.log(JSON.stringify(rows, null, 2));
});
