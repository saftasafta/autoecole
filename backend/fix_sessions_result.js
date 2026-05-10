const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE sessions ADD COLUMN result TEXT", (err) => {
    if (err) {
      console.log('Error or column exists:', err.message);
    } else {
      console.log('Added "result" column to sessions.');
    }
  });
});
db.close();
