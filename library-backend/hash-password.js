const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('library-backend\database.db', (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log('Connected to the database');
});

async function hashPasswords() {
  // Get all users
  db.all('SELECT id, username, password FROM USERS', [], async (err, users) => {
    if (err) {
      console.error(err.message);
      return;
    }
   
    // Hash each user's password
    for (const user of users) {
      // Assume passwords are stored in plain text for now
      // In a real scenario, you'd prompt for passwords for each user
      let plainPassword;
     
      if (user.username === 'student1') {
        plainPassword = 'student123';
      } else if (user.username === 'admin1') {
        plainPassword = 'admin123';
      } else {
        continue; // Skip if we don't know the password
      }
     
      // Hash the password
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
     
      // Update the user's password in the database
      db.run('UPDATE USERS SET password = ? WHERE id = ?', [hashedPassword, user.id], (err) => {
        if (err) {
          console.error(`Failed to update password for ${user.username}:`, err.message);
        } else {
          console.log(`Updated password for ${user.username}`);
        }
      });
    }
  });
}

hashPasswords();

// Close the database connection after 2 seconds
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
  });
}, 2000);