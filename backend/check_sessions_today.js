const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autoecole.db');

// Check all sessions for today's date (ignoring cancelled filter)
db.all(
  "SELECT id, type, start_time, status, date(start_time) as parsed_date FROM sessions WHERE type NOT LIKE 'Examen%' AND date(start_time) = date('now','localtime')",
  [],
  (err, rows) => {
    if (err) { console.error('Error:', err); }
    console.log('Sessions for TODAY (including cancelled):', rows ? rows.length : 0);
    console.log(JSON.stringify(rows, null, 2));
    
    // Also check total count and date range
    db.all(
      "SELECT date(start_time) as d, COUNT(*) as cnt FROM sessions WHERE type NOT LIKE 'Examen%' GROUP BY d ORDER BY d DESC LIMIT 10",
      [],
      (err2, rows2) => {
        if (err2) console.error(err2);
        console.log('\nSessions by date (last 10 days):');
        console.log(JSON.stringify(rows2, null, 2));
        db.close();
      }
    );
  }
);
