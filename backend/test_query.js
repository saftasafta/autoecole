const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('autoecole.db');

const filter = " WHERE strftime('%m', date) = '05' AND strftime('%Y', date) = '2026' ";

const dataSql = `
  SELECT id, amount, category, date, description, 'General' as source FROM general_expenses ${filter}
  UNION ALL
  SELECT ve.id, ve.amount, ve.category, ve.date, 
         ('Fleet: ' || COALESCE(v.model, 'Vehicule Supprimé') || ' (' || COALESCE(v.registration_plate, 'N/A') || ') ' || COALESCE(ve.description, '')) as description, 
         'Fleet' as source 
  FROM vehicle_expenses ve
  LEFT JOIN vehicles v ON ve.vehicle_id = v.id
  ${filter.replace(/date/g, 've.date')}
  ORDER BY date DESC
`;

db.all(dataSql, (err, rows) => {
  if (err) console.error(err);
  console.log('--- QUERY RESULTS ---');
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
