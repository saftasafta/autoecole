const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'autoecole.db');
const db = new sqlite3.Database(dbPath);

const query = `
    SELECT u.id as user_id, u.name, u.email, u.phone, u.role, i.id as instructor_id, i.mission,
    COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE instructor_id = i.id AND status = 'completed'), 0) as total_hours,
    (SELECT COUNT(*) FROM sessions WHERE instructor_id = i.id AND type LIKE 'Examen%' AND status = 'completed') as total_exams,
    (SELECT COUNT(*) FROM sessions WHERE instructor_id = i.id AND type LIKE 'Examen%' AND status = 'completed' AND result = 'pass') as passed_exams
    FROM users u
    JOIN instructors i ON u.id = i.user_id
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('QUERY FAILED:', err.message);
  } else {
    console.log('QUERY SUCCESS:', rows.length, 'rows');
  }
  db.close();
});
