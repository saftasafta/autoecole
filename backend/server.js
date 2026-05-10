const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://autoecole-zeta.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_autoecole';

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      const now = Math.floor(Date.now() / 1000);
      try {
        const decoded = jwt.decode(token);
        console.log(`JWT Error: ${err.message}. Now: ${now}, Exp: ${decoded?.exp}`);
      } catch (e) {
        console.log('JWT Error:', err.message);
      }
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    console.log(`Issued new token for ${user.email}. Exp: 30d`);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });
});

// Tariffs
app.get('/api/tariffs', authenticateToken, (req, res) => {
  db.get('SELECT * FROM tariffs LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.put('/api/tariffs', authenticateToken, (req, res) => {
  const { code_hour_price, driving_hour_price, exam_code_price, exam_driving_price, exam_parking_price } = req.body;
  db.run(`UPDATE tariffs SET 
    code_hour_price = ?, driving_hour_price = ?, exam_code_price = ?, exam_driving_price = ?, exam_parking_price = ?`,
    [code_hour_price, driving_hour_price, exam_code_price, exam_driving_price, exam_parking_price], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

// Dashboard Stats
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const stats = {};
  db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM students', (err, row) => {
      stats.students = row.count;
      db.get("SELECT COUNT(*) as count FROM sessions WHERE type = 'Code' AND status != 'cancelled'", (err, row) => {
        stats.sessionsCode = row.count || 0;
        db.get("SELECT COUNT(*) as count FROM sessions WHERE type = 'Conduite' AND status != 'cancelled'", (err, row) => {
          stats.sessionsDriving = row.count || 0;
          db.get("SELECT COUNT(*) as count FROM sessions WHERE type = 'Parking' AND status != 'cancelled'", (err, row) => {
            stats.sessionsParking = row.count || 0;
            db.get('SELECT SUM(amount) as total FROM payments', (err, row) => {
              stats.revenue = row.total || 0;
              db.get('SELECT COUNT(*) as count FROM vehicles WHERE status = "active"', (err, row) => {
                stats.vehicles = row.count;
                db.all(`
                  SELECT 'session' as type, s.start_time as date, st.name as student_name, s.type as detail, s.status
                  FROM sessions s 
                  LEFT JOIN students st ON s.student_id = st.id
                  ORDER BY s.start_time DESC LIMIT 5
                `, [], (err, recentSessions) => {
                  db.all(`
                    SELECT 'payment' as type, p.payment_date as date, st.name as student_name, p.amount as detail, 'completed' as status
                    FROM payments p
                    LEFT JOIN students st ON p.student_id = st.id
                    ORDER BY p.payment_date DESC LIMIT 5
                  `, [], (err, recentPayments) => {
                    const recent = [...(recentSessions || []), ...(recentPayments || [])]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 5);
                    stats.recentActivity = recent;
                    res.json(stats);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Students CRUD
app.get('/api/students', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let baseQuery = `FROM students s`;
  let countParams = [];
  let dataParams = [];

  if (search) {
    baseQuery += ` WHERE s.name LIKE ? OR s.cin LIKE ?`;
    countParams.push(`%${search}%`, `%${search}%`);
    dataParams.push(`%${search}%`, `%${search}%`);
  }

  dataParams.push(limit, offset);

  db.get(`SELECT COUNT(*) as total ${baseQuery}`, countParams, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    db.get('SELECT * FROM tariffs LIMIT 1', (err, tariffs) => {
      db.all(`
        SELECT 
          s.*, 
          COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id), 0) as total_paid,
          COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE student_id = s.id AND type = 'Conduite' AND status != 'cancelled'), 0) as total_driving_hours,
          COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE student_id = s.id AND type = 'Parking' AND status != 'cancelled'), 0) as total_parking_hours,
          COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE student_id = s.id AND type = 'Code' AND status != 'cancelled'), 0) as total_code_hours,
          (SELECT COUNT(*) FROM sessions WHERE student_id = s.id AND type = 'Examen Code' AND status != 'cancelled') as count_exam_code,
          (SELECT COUNT(*) FROM sessions WHERE student_id = s.id AND type = 'Examen Conduite' AND status != 'cancelled') as count_exam_driving,
          (SELECT COUNT(*) FROM sessions WHERE student_id = s.id AND type = 'Examen Parking' AND status != 'cancelled') as count_exam_parking
        ${baseQuery}
        ORDER BY s.id DESC
        LIMIT ? OFFSET ?
      `, dataParams, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const mapped = rows.map(student => {
          const codeHourCost = student.total_code_hours * tariffs.code_hour_price;
          const drivingCost = student.total_driving_hours * tariffs.driving_hour_price;
          const parkingCost = student.total_parking_hours * tariffs.driving_hour_price;
          const examCost = (student.count_exam_code * tariffs.exam_code_price) +
                           (student.count_exam_driving * tariffs.exam_driving_price) +
                           (student.count_exam_parking * tariffs.exam_parking_price);
          const totalCost = codeHourCost + drivingCost + parkingCost + examCost;
          const remaining = totalCost - student.total_paid;
          
          return {
            ...student,
            total_cost: totalCost,
            remaining_balance: remaining,
            payment_status: remaining <= 0 ? 'Payé' : 'Non Payé'
          };
        });
        res.json({
          data: mapped,
          total,
          page,
          totalPages
        });
      });
    });
  });
});

app.post('/api/students', authenticateToken, (req, res) => {
  const { name, cin, phone, notes } = req.body;
  db.run(`INSERT INTO students (name, cin, phone, notes) VALUES (?, ?, ?, ?)`,
    [name, cin, phone, notes], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, cin, phone, notes } = req.body;
  db.run(`UPDATE students SET name = ?, cin = ?, phone = ?, notes = ? WHERE id = ?`,
    [name, cin, phone, notes, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Student updated' });
    });
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    // Delete related records first
    db.run('DELETE FROM sessions WHERE student_id = ?', [id]);
    db.run('DELETE FROM payments WHERE student_id = ?', [id]);
    // Finally delete the student
    db.run('DELETE FROM students WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Student and all related records deleted' });
    });
  });
});

app.get('/api/students/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM tariffs LIMIT 1', (err, tariffs) => {
    db.get(`
      SELECT 
        s.*, 
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id), 0) as total_paid,
        COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE student_id = s.id AND type = 'Conduite' AND status != 'cancelled'), 0) as total_driving_hours,
        COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE student_id = s.id AND type = 'Parking' AND status != 'cancelled'), 0) as total_parking_hours,
        COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE student_id = s.id AND type = 'Code' AND status != 'cancelled'), 0) as total_code_hours,
        (SELECT COUNT(*) FROM sessions WHERE student_id = s.id AND type = 'Examen Code' AND status != 'cancelled') as count_exam_code,
        (SELECT COUNT(*) FROM sessions WHERE student_id = s.id AND type = 'Examen Conduite' AND status != 'cancelled') as count_exam_driving,
        (SELECT COUNT(*) FROM sessions WHERE student_id = s.id AND type = 'Examen Parking' AND status != 'cancelled') as count_exam_parking,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Code Pack'), 0) as paid_code_pack,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Heures Conduite'), 0) as paid_conduite,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Heures Parking'), 0) as paid_parking,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Examen Code'), 0) as paid_exam_code,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Examen Conduite'), 0) as paid_exam_driving,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Examen Parking'), 0) as paid_exam_parking,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id AND payment_type = 'Autre'), 0) as paid_autre
      FROM students s WHERE s.id = ?
    `, [id], (err, student) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!student) return res.status(404).json({ error: 'Student not found' });
      
      const codeHourCost = student.total_code_hours * tariffs.code_hour_price;
      const drivingCost = student.total_driving_hours * tariffs.driving_hour_price;
      const parkingCost = student.total_parking_hours * tariffs.driving_hour_price;
      const examCost = (student.count_exam_code * tariffs.exam_code_price) +
                       (student.count_exam_driving * tariffs.exam_driving_price) +
                       (student.count_exam_parking * tariffs.exam_parking_price);
      const totalCost = codeHourCost + drivingCost + parkingCost + examCost;
      const remaining = totalCost - student.total_paid;
      
      student.total_cost = totalCost;
      student.remaining_balance = remaining;
      student.payment_status = remaining <= 0 ? 'Payé' : 'Non Payé';
      
      student.billing_details = {
        code_hours: { hours: student.total_code_hours, cost: codeHourCost, paid: student.paid_autre }, // Assuming 'autre' for now or similar
        conduite: { hours: student.total_driving_hours, cost: drivingCost, paid: student.paid_conduite },
        parking: { hours: student.total_parking_hours, cost: parkingCost, paid: student.paid_parking },
        exam_code: { count: student.count_exam_code, cost: student.count_exam_code * tariffs.exam_code_price, paid: student.paid_exam_code },
        exam_driving: { count: student.count_exam_driving, cost: student.count_exam_driving * tariffs.exam_driving_price, paid: student.paid_exam_driving },
        exam_parking: { count: student.count_exam_parking, cost: student.count_exam_parking * tariffs.exam_parking_price, paid: student.paid_exam_parking },
        autre: { cost: 0, paid: student.paid_autre } // Just payments, no cost associated natively
      };
      
      // fetch sessions and payments
      db.all('SELECT * FROM sessions WHERE student_id = ? ORDER BY start_time DESC', [id], (err, sessions) => {
        db.all('SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC', [id], (err, payments) => {
          res.json({ ...student, sessions: sessions || [], payments: payments || [] });
        });
      });
    });
  });
});

// Sessions CRUD
app.get('/api/sessions', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM sessions 
    LEFT JOIN students ON sessions.student_id = students.id
  `;
  let countParams = [];
  let dataParams = [];

  if (search) {
    baseQuery += ` WHERE students.name ILIKE ? OR sessions.type ILIKE ? OR students.cin ILIKE ?`;
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    dataParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  dataParams.push(limit, offset);

  db.get(`SELECT COUNT(*) as total ${baseQuery}`, countParams, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    db.all(`
      SELECT sessions.*, students.name as student_name, students.cin as student_cin 
      ${baseQuery}
      ORDER BY sessions.start_time DESC
      LIMIT ? OFFSET ?
    `, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows, total, page, totalPages });
    });
  });
});

app.post('/api/sessions', authenticateToken, (req, res) => {
  const { student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status, result } = req.body;

  // If it's an exam type, apply day-based validation rules
  if (type && type.startsWith('Examen') && student_id && start_time) {
    const examDate = start_time.split('T')[0]; // Extract YYYY-MM-DD

    db.all(
      `SELECT type FROM sessions 
       WHERE student_id = ? 
         AND type LIKE 'Examen%' 
         AND status != 'cancelled'
         AND sessions.start_time::date = ?::date`,
      [student_id, examDate],
      (err, existingExams) => {
        if (err) return res.status(500).json({ error: err.message });

        // Rule 1: Cannot register more than 3 exams in one day
        if (existingExams.length >= 3) {
          return res.status(400).json({
            error: `L'élève a déjà 3 examens enregistrés pour cette journée. Il n'est pas possible d'en ajouter davantage.`
          });
        }

        // Rule 2: Cannot register the same exam type twice on the same day
        const duplicate = existingExams.find(e => e.type === type);
        if (duplicate) {
          return res.status(400).json({
            error: `L'élève est déjà inscrit à un "${type}" pour cette journée.`
          });
        }

        // All checks passed — insert the session
        db.run(
          `INSERT INTO sessions (student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [student_id, instructor_id, vehicle_id, type, duration_hours || 1, start_time, status || 'scheduled', result],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
          }
        );
      }
    );
  } else {
    // Not an exam — insert directly
    db.run(
      `INSERT INTO sessions (student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, instructor_id, vehicle_id, type, duration_hours || 1, start_time, status || 'scheduled', result],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
      }
    );
  }
});

app.put('/api/sessions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status, result } = req.body;
  db.run(`UPDATE sessions SET student_id = ?, instructor_id = ?, vehicle_id = ?, type = ?, duration_hours = ?, start_time = ?, status = ?, result = ? WHERE id = ?`,
    [student_id, instructor_id, vehicle_id, type, duration_hours, start_time, status, result, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Session updated' });
    });
});

app.delete('/api/sessions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM sessions WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Session deleted' });
  });
});

app.delete('/api/student-maintenance/:id/clear-sessions', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'all', 'Code', 'Conduite', 'Parking'
  
  let query = 'DELETE FROM sessions WHERE student_id = ?';
  let params = [id];
  
  if (type === 'Code') {
    query += " AND type IN ('Code', 'Examen Code')";
  } else if (type === 'Conduite') {
    query += " AND type IN ('Conduite', 'Examen Conduite')";
  } else if (type === 'Parking') {
    query += " AND type IN ('Parking', 'Examen Parking')";
  }
  
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `${this.changes} sessions deleted` });
  });
});

app.delete('/api/student-maintenance/:id/clear-exams', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'all', 'Code', 'Conduite', 'Parking'
  
  let query = "DELETE FROM sessions WHERE student_id = ? AND type LIKE 'Examen%'";
  let params = [id];
  
  if (type === 'Code') {
    query += " AND type = 'Examen Code'";
  } else if (type === 'Conduite') {
    query += " AND type = 'Examen Conduite'";
  } else if (type === 'Parking') {
    query += " AND type = 'Examen Parking'";
  }
  
  db.run(query, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `${this.changes} exams deleted` });
  });
});

app.get('/api/sessions/today', authenticateToken, (req, res) => {
  db.all(`
    SELECT sessions.*, students.name as student_name, students.cin as student_cin
    FROM sessions 
    LEFT JOIN students ON sessions.student_id = students.id
    WHERE sessions.type NOT ILIKE 'Examen%' 
    AND sessions.start_time::date = CURRENT_DATE
    AND sessions.status != 'cancelled'
    ORDER BY start_time ASC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Exams routes handled below

// Payments CRUD

// Payments CRUD
app.get('/api/payments', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM payments 
    LEFT JOIN students ON payments.student_id = students.id
  `;
  let countParams = [];
  let dataParams = [];

  if (search) {
    baseQuery += ` WHERE students.name ILIKE ? OR payments.payment_type ILIKE ? OR students.cin ILIKE ?`;
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    dataParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  dataParams.push(limit, offset);

  db.get(`SELECT COUNT(*) as total ${baseQuery}`, countParams, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    db.all(`
      SELECT payments.*, students.name as student_name 
      ${baseQuery}
      ORDER BY payments.payment_date DESC
      LIMIT ? OFFSET ?
    `, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: rows, total, page, totalPages });
    });
  });
});

app.get('/api/exams/all', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM sessions s
    LEFT JOIN students st ON s.student_id = st.id
    WHERE s.type ILIKE 'Examen%'
  `;
  const params = [];

  if (search) {
    baseQuery += ` AND (st.name ILIKE ? OR st.cin ILIKE ?) `;
    params.push(`%${search}%`, `%${search}%`);
  }

  db.get(`SELECT COUNT(*) as count ${baseQuery}`, params, (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const dataParams = [...params, limit, offset];
    db.all(`
      SELECT s.*, st.name as student_name, st.cin as student_cin, st.phone as student_phone
      ${baseQuery}
      ORDER BY s.start_time DESC 
      LIMIT ? OFFSET ?
    `, dataParams, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        data: rows,
        total: countRow.count,
        page,
        limit,
        totalPages: Math.ceil(countRow.count / limit)
      });
    });
  });
});

// Exams specific route - today
app.get('/api/exams/today', authenticateToken, (req, res) => {
  db.all(`
    SELECT sessions.*, students.name as student_name, students.cin as student_cin 
    FROM sessions 
    LEFT JOIN students ON sessions.student_id = students.id
    WHERE sessions.type ILIKE 'Examen%' 
    AND sessions.start_time::date = CURRENT_DATE
    AND sessions.status != 'cancelled'
    ORDER BY start_time ASC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/payments', authenticateToken, (req, res) => {
  const { student_id, amount, payment_type } = req.body;
  db.run(`INSERT INTO payments (student_id, amount, payment_type) VALUES (?, ?, ?)`,
    [student_id, amount, payment_type || 'Autre'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/payments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM payments WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Payment deleted' });
  });
});

// --- Vehicles CRUD ---
app.get('/api/vehicles', authenticateToken, (req, res) => {
  db.all(`
    SELECT v.*, 
    (SELECT SUM(amount) FROM vehicle_expenses WHERE vehicle_id = v.id) as total_expenses
    FROM vehicles v
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/vehicles', authenticateToken, (req, res) => {
  const { model, registration_plate, status, insurance_expiry, tech_inspection_expiry, last_oil_change_km, oil_interval, last_maintenance, mileage } = req.body;
  db.run(`INSERT INTO vehicles (model, registration_plate, status, insurance_expiry, tech_inspection_expiry, last_oil_change_km, oil_interval, last_maintenance, mileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [model, registration_plate, status || 'active', insurance_expiry, tech_inspection_expiry, last_oil_change_km || 0, oil_interval || 10000, last_maintenance, mileage || 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/vehicles/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { model, registration_plate, status, insurance_expiry, tech_inspection_expiry, last_oil_change_km, oil_interval, last_maintenance, mileage } = req.body;
  db.run(`UPDATE vehicles SET model = ?, registration_plate = ?, status = ?, insurance_expiry = ?, tech_inspection_expiry = ?, last_oil_change_km = ?, oil_interval = ?, last_maintenance = ?, mileage = ? WHERE id = ?`,
    [model, registration_plate, status, insurance_expiry, tech_inspection_expiry, last_oil_change_km, oil_interval, last_maintenance, mileage, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Vehicle updated' });
    });
});

app.delete('/api/vehicles/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM vehicle_expenses WHERE vehicle_id = ?', [id]);
    db.run('DELETE FROM vehicle_daily_logs WHERE vehicle_id = ?', [id]);
    db.run('UPDATE sessions SET vehicle_id = NULL WHERE vehicle_id = ?', [id]);
    db.run('DELETE FROM vehicles WHERE id = ?', [id], (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      db.run('COMMIT');
      res.json({ message: 'Vehicle and all associated records deleted' });
    });
  });
});

// --- Vehicle Expenses ---
app.get('/api/vehicles/:id/expenses', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM vehicle_expenses WHERE vehicle_id = ? ORDER BY date DESC', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/vehicles/:id/expenses', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount, category, date, description } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return res.status(400).json({ error: 'Invalid amount' });

  db.run(`INSERT INTO vehicle_expenses (vehicle_id, amount, category, date, description) VALUES (?, ?, ?, ?, ?)`,
    [id, numAmount, category, date, description], function(err) {
      if (err) {
        console.error('DATABASE ERROR (POST vehicle_expenses):', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body, amount: numAmount });
    });
});

app.delete('/api/vehicles/any/expenses/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM vehicle_expenses WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Vehicle Daily Logs ---
app.get('/api/vehicles/:id/logs', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM vehicle_daily_logs WHERE vehicle_id = ? ORDER BY date DESC LIMIT 30', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/vehicles/:id/logs', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { date, start_km, end_km, notes } = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('INSERT INTO vehicle_daily_logs (vehicle_id, date, start_km, end_km, notes) VALUES (?, ?, ?, ?, ?)',
      [id, date, start_km, end_km, notes], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('UPDATE vehicles SET mileage = ? WHERE id = ?', [end_km, id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          db.run('COMMIT');
          res.json({ id: this.lastID, message: 'Log added and mileage updated' });
        });
      });
  });
});

app.put('/api/vehicles/:id/logs/:log_id', authenticateToken, (req, res) => {
  const { id, log_id } = req.params;
  const { date, start_km, end_km, notes } = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('UPDATE vehicle_daily_logs SET date = ?, start_km = ?, end_km = ?, notes = ? WHERE id = ? AND vehicle_id = ?',
      [date, start_km, end_km, notes, log_id, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('UPDATE vehicles SET mileage = ? WHERE id = ?', [end_km, id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          db.run('COMMIT');
          res.json({ message: 'Log updated and mileage adjusted' });
        });
      });
  });
});

app.delete('/api/vehicles/:id/logs/:log_id', authenticateToken, (req, res) => {
  const { id, log_id } = req.params;
  
  db.run('DELETE FROM vehicle_daily_logs WHERE id = ? AND vehicle_id = ?', [log_id, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Log deleted' });
  });
});

// --- Finances & General Expenses ---
app.get('/api/finances/summary', authenticateToken, (req, res) => {
  const { month, year } = req.query;
  let filter = '';
  const params = [];

  if (month && year) {
    filter = ` WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ? `;
    params.push(month.padStart(2, '0'), year);
  } else if (year) {
    filter = ` WHERE strftime('%Y', date) = ? `;
    params.push(year);
  }

  // Payments use 'payment_date' instead of 'date'
  let paymentFilter = filter.replace(/date/g, 'payment_date');

  const sql = `
    SELECT 
      (SELECT SUM(amount) FROM payments ${paymentFilter}) as revenue,
      (SELECT SUM(amount) FROM vehicle_expenses ${filter}) as vehicle_expenses,
      (SELECT SUM(amount) FROM general_expenses ${filter}) as general_expenses
  `;

  // We need to pass the params for each subquery
  const allParams = [...params, ...params, ...params];

  db.get(sql, allParams, (err, row) => {
    if (err) {
      console.error('DATABASE ERROR (GET summary):', err.message);
      return res.status(500).json({ error: err.message });
    }
    const results = {
      revenue: row.revenue || 0,
      vehicle_expenses: row.vehicle_expenses || 0,
      general_expenses: row.general_expenses || 0
    };
    results.total_expenses = results.vehicle_expenses + results.general_expenses;
    results.profit = results.revenue - results.total_expenses;
    res.json(results);
  });
});

app.get('/api/finances/expenses', authenticateToken, (req, res) => {
  const { month, year, page = 1, limit = 20, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let filter = ' WHERE 1=1 ';
  const params = [];

  if (month && year) {
    filter += ` AND strftime('%m', date) = ? AND strftime('%Y', date) = ? `;
    params.push(month.padStart(2, '0'), year);
  } else if (year) {
    filter += ` AND strftime('%Y', date) = ? `;
    params.push(year);
  }

  if (search) {
    filter += ` AND (category LIKE ? OR description LIKE ?) `;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Count total from both tables
  const countSql = `
    SELECT (
      (SELECT COUNT(*) FROM general_expenses ${filter}) +
      (SELECT COUNT(*) FROM vehicle_expenses ${filter.replace(/date/g, 'date')})
    ) as count
  `;

  db.get(countSql, [...params, ...params], (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });
    
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
      LIMIT ? OFFSET ?
    `;

    db.all(dataSql, [...params, ...params, parseInt(limit), offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        data: rows,
        total: countRow.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countRow.count / parseInt(limit))
      });
    });
  });
});

app.post('/api/finances/expenses', authenticateToken, (req, res) => {
  console.log('--- DEBUG: POST /api/finances/expenses called ---');
  const { amount, category, date, description } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return res.status(400).json({ error: 'Invalid amount' });

  db.run('INSERT INTO general_expenses (amount, category, `date`, description) VALUES (?, ?, ?, ?)',
    [numAmount, category, date, description], function(err) {
      if (err) {
        console.error('DATABASE ERROR (POST general_expenses):', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, ...req.body, amount: numAmount });
    });
});

app.put('/api/finances/expenses/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount, category, date, description } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return res.status(400).json({ error: 'Invalid amount' });

  db.run('UPDATE general_expenses SET amount = ?, category = ?, date = ?, description = ? WHERE id = ?',
    [numAmount, category, date, description, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/finances/expenses/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM general_expenses WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Instructors Stats ---
app.get('/api/instructors', authenticateToken, (req, res) => {
  db.all(`
    SELECT u.id as user_id, u.name, u.email, u.phone, u.role, i.id as instructor_id, i.mission,
    COALESCE((SELECT SUM(duration_hours) FROM sessions WHERE instructor_id = i.id AND status = 'completed'), 0) as total_hours,
    (SELECT COUNT(*) FROM sessions WHERE instructor_id = i.id AND type LIKE 'Examen%' AND status = 'completed') as total_exams,
    (SELECT COUNT(*) FROM sessions WHERE instructor_id = i.id AND type LIKE 'Examen%' AND status = 'completed' AND result = 'pass') as passed_exams,
    (SELECT COUNT(*) FROM sessions WHERE instructor_id = i.id AND type LIKE 'Examen%' AND status = 'completed' AND result = 'fail') as failed_exams
    FROM users u
    JOIN instructors i ON u.id = i.user_id
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const mapped = rows.map(ins => ({
      ...ins,
      pass_rate: ins.total_exams > 0 ? ((ins.passed_exams / ins.total_exams) * 100).toFixed(1) : 0,
      fail_rate: ins.total_exams > 0 ? ((ins.failed_exams / ins.total_exams) * 100).toFixed(1) : 0
    }));
    res.json(mapped);
  });
});

app.post('/api/instructors', authenticateToken, async (req, res) => {
  const { name, email, password, phone, role, mission } = req.body;
  
  try {
    const hash = await bcrypt.hash(password || '123456', 10);
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      db.run(
        `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)`,
        [name, email, hash, role || 'instructor', phone],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          const userId = this.lastID;
          db.run(
            `INSERT INTO instructors (user_id, mission) VALUES (?, ?)`,
            [userId, mission],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }
              
              db.run('COMMIT');
              res.json({ id: this.lastID, userId, name, email, role, mission, phone });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/instructors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone, role, mission } = req.body;
  
  try {
    let sql = 'UPDATE users SET name = ?, email = ?, role = ?, phone = ?';
    let params = [name, email, role, phone];
    
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      sql += ', password_hash = ?';
      params.push(hash);
    }
    
    sql += ' WHERE id = (SELECT user_id FROM instructors WHERE id = ?)';
    params.push(id);
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(sql, params, function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        db.run('UPDATE instructors SET mission = ? WHERE id = ?', [mission, id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          db.run('COMMIT');
          res.json({ message: 'Instructor updated' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/instructors/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT user_id FROM instructors WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Instructor not found' });
    
    const userId = row.user_id;
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      // Delete sessions first to avoid FK constraints if any (though not strictly necessary if CASCADE but let's be safe)
      db.run('DELETE FROM sessions WHERE instructor_id = ?', [id]);
      db.run('DELETE FROM instructors WHERE id = ?', [id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          db.run('COMMIT');
          res.json({ message: 'Instructor and associated user deleted' });
        });
      });
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
