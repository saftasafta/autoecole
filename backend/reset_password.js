const db = require('./database');
const bcrypt = require('bcrypt');

const email = 'mamounsafta58@gmail.com';
const newPassword = 'admin123';

bcrypt.hash(newPassword, 10, (err, hash) => {
  if (err) { console.error(err); return; }
  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email], function(err2) {
    if (err2) { console.error(err2); return; }
    console.log(`✅ Password reset for ${email}`);
    console.log(`New password: ${newPassword}`);
    db.close();
  });
});
