const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  } else {
    console.log('Connected to db for migration');
    
    db.serialize(() => {
      // Add cin to students
      db.run("ALTER TABLE students ADD COLUMN cin TEXT", (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log('Column cin already exists');
          } else {
            console.error('Error adding column cin', err.message);
          }
        } else {
          console.log('Added cin to students table');
        }
      });
    });
  }
});
