const db = require('./database');
const bcrypt = require('bcrypt');

db.get("SELECT * FROM users WHERE email = 'admin@autoecole.com'", async (err, user) => {
  if (err) { console.error(err); return; }
  if (!user) { console.log('❌ User not found'); return; }
  
  console.log('User found:', user.email, user.role);
  
  const valid = await bcrypt.compare('admin123', user.password_hash);
  console.log('Password "admin123" valid:', valid);
  
  // Also reset it to be safe
  const hash = await bcrypt.hash('admin123', 10);
  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, 'admin@autoecole.com'], function(err2) {
    if (err2) console.error(err2);
    else console.log('✅ Admin password reset to: admin123');
    db.close();
  });
});
