const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const sqliteDb = new sqlite3.Database(path.resolve(__dirname, 'autoecole.db'));
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrateTable = (tableName, sqliteQuery) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sqliteQuery, [], async (err, rows) => {
      if (err) return reject(err);
      if (rows.length === 0) return resolve();

      console.log(`Migrating ${rows.length} rows from ${tableName}...`);
      
      const keys = Object.keys(rows[0]);
      const columns = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      for (const row of rows) {
        const values = Object.values(row);
        try {
          await pgPool.query(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
        } catch (pgErr) {
          console.error(`Error inserting into ${tableName}:`, pgErr.message);
        }
      }
      resolve();
    });
  });
};

const runMigration = async () => {
  try {
    console.log('Starting migration to Supabase...');
    
    await migrateTable('tariffs', 'SELECT * FROM tariffs');
    await migrateTable('users', 'SELECT * FROM users');
    await migrateTable('students', 'SELECT * FROM students');
    await migrateTable('instructors', 'SELECT * FROM instructors');
    await migrateTable('vehicles', 'SELECT * FROM vehicles');
    await migrateTable('vehicle_expenses', 'SELECT * FROM vehicle_expenses');
    await migrateTable('general_expenses', 'SELECT * FROM general_expenses');
    await migrateTable('vehicle_daily_logs', 'SELECT * FROM vehicle_daily_logs');
    await migrateTable('sessions', 'SELECT * FROM sessions');
    await migrateTable('payments', 'SELECT * FROM payments');

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
};

runMigration();
