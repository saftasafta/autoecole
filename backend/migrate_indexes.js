const db = require('./database');

db.serialize(() => {
  console.log('Adding database indexes...');

  // Indexes for faster joins and filtering
  const queries = [
    'CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time)',
    'CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)',
    'CREATE INDEX IF NOT EXISTS idx_students_name ON students(name)',
    'CREATE INDEX IF NOT EXISTS idx_students_cin ON students(cin)'
  ];

  queries.forEach(query => {
    db.run(query, (err) => {
      if (err) {
        console.error('Error creating index:', err.message);
      } else {
        console.log('Successfully executed:', query);
      }
    });
  });

  console.log('Index migration complete.');
});
