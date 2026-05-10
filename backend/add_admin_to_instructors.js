const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.get("SELECT id FROM users WHERE email = 'admin@autoecole.com'", (err, user) => {
  if (user) {
    db.run("INSERT OR IGNORE INTO instructors (user_id, mission) VALUES (?, ?)", [user.id, 'Directeur de l\'auto-école'], (err) => {
      if (err) console.error(err.message);
      else console.log('Admin added to instructors table.');
      db.close();
    });
  } else {
    db.close();
  }
});
