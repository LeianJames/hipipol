const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Create and connect to the database
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    createTables();
  }
});

// Create necessary tables
function createTables() {
  // Create USERS table
  db.run(`CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`, [], (err) => {
    if (err) {
      console.error('Error creating USERS table:', err.message);
    } else {
      console.log('USERS table created or already exists');
      createDefaultUsers();
    }
  });
 
  // Create BOOKS table
  db.run(`CREATE TABLE IF NOT EXISTS BOOKS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    location TEXT,
    available BOOLEAN DEFAULT 1
  )`, [], (err) => {
    if (err) {
      console.error('Error creating BOOKS table:', err.message);
    } else {
      console.log('BOOKS table created or already exists');
      importDefaultBooks();
    }
  });
}

// Create default users if they don't exist
async function createDefaultUsers() {
  // Check if admin user exists
  db.get('SELECT * FROM USERS WHERE username = ?', ['admin1'], async (err, user) => {
    if (err) {
      console.error('Error checking admin user:', err.message);
    } else if (!user) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.run('INSERT INTO USERS (username, password, role) VALUES (?, ?, ?)',
        ['admin1', hashedPassword, 'admin'],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err.message);
          } else {
            console.log('Admin user created');
          }
        }
      );
    }
  });
 
  // Check if student user exists
  db.get('SELECT * FROM USERS WHERE username = ?', ['student1'], async (err, user) => {
    if (err) {
      console.error('Error checking student user:', err.message);
    } else if (!user) {
      // Create student user
      const hashedPassword = await bcrypt.hash('student123', 10);
      db.run('INSERT INTO USERS (username, password, role) VALUES (?, ?, ?)',
        ['student1', hashedPassword, 'student'],
        (err) => {
          if (err) {
            console.error('Error creating student user:', err.message);
          } else {
            console.log('Student user created');
          }
        }
      );
    }
  });
}

// Import default books from academicsdatabase.js
function importDefaultBooks() {
  // Check if books exist
  db.get('SELECT COUNT(*) as count FROM BOOKS', [], (err, result) => {
    if (err) {
      console.error('Error checking books count:', err.message);
    } else if (result.count === 0) {
      // Import books from our predefined list
      const books = [
        {
          title: "Carbon Jargon: Making Sense of the life Science of Climate Change",
          author: "N/A,",
          description: "Book - 159 pages;",
          location: "Nova Schola Main Library",
          available: true
        },
        {
          title: "General Ecology",
          author: "David T. Krohne, author.",
          description: "Book - 505 pages;",
          location: "Nova Schola Main Library",
          available: true
        },
        // Add more books here as needed
      ];
     
      // Insert each book
      books.forEach(book => {
        db.run(
          'INSERT INTO BOOKS (title, author, description, location, available) VALUES (?, ?, ?, ?, ?)',
          [book.title, book.author, book.description, book.location, book.available ? 1 : 0],
          (err) => {
            if (err) {
              console.error(`Error inserting book "${book.title}":`, err.message);
            }
          }
        );
      });
     
      console.log(`Imported ${books.length} default books`);
    }
  });
}

// Close database connection after 5 seconds
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}, 5000);
