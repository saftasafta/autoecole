const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE instructors ADD COLUMN mission TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "mission" already exists in instructors table.');
      } else {
        console.error('Error adding column "mission":', err.message);
      }
    } else {
      console.log('Successfully added column "mission" to instructors table.');
    }
  });
});

db.close();
