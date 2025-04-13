const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(cors({
  origin: '*', // Allow requests from any origin during development
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'Sambat', // Change this to a random string (secret key)
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, './database.db'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Initialize database tables
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Create USERS table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating USERS table:', err.message);
    } else {
      console.log('USERS table initialized');
      
      // Check if we need to create default users
      db.get('SELECT COUNT(*) as count FROM USERS', [], async (err, result) => {
        if (err) {
          console.error('Error checking USERS:', err.message);
        } else if (result.count === 0) {
          // Create default admin and student users
          const adminPassword = await bcrypt.hash('admin123', 10);
          const studentPassword = await bcrypt.hash('student123', 10);
          
          db.run('INSERT INTO USERS (username, password, role) VALUES (?, ?, ?)', 
            ['admin1', adminPassword, 'admin'], (err) => {
              if (err) console.error('Error creating admin user:', err.message);
              else console.log('Admin user created');
          });
          
          db.run('INSERT INTO USERS (username, password, role) VALUES (?, ?, ?)', 
            ['student1', studentPassword, 'student'], (err) => {
              if (err) console.error('Error creating student user:', err.message);
              else console.log('Student user created');
          });
        }
      });
    }
  });
  
  // Create BOOKS table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS BOOKS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    location TEXT,
    available BOOLEAN DEFAULT 1
  )`, (err) => {
    if (err) {
      console.error('Error creating BOOKS table:', err.message);
    } else {
      console.log('BOOKS table initialized');
      
      // Add sample books if no books exist
      db.get('SELECT COUNT(*) as count FROM BOOKS', [], (err, result) => {
        if (err) {
          console.error('Error checking BOOKS:', err.message);
        } else if (result.count === 0) {
          // Insert sample books from academicsdatabase.js
          const sampleBooks = require('../Academics Books/academicsdatabase.js').books;
          sampleBooks.forEach(book => {
            db.run('INSERT INTO BOOKS (title, author, description, location, available) VALUES (?, ?, ?, ?, ?)',
              [book.title, book.author, book.description, book.location, book.available ? 1 : 0],
              (err) => {
                if (err) console.error(`Error adding book ${book.title}:`, err.message);
            });
          });
          console.log('Sample books added');
        }
      });
    }
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Define routes
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
 
  // Query the database for the user
  db.get('SELECT * FROM USERS WHERE username = ? AND role = ?', [username, role], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
   
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or role' });
    }
   
    try {
      // Compare hashed passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }
     
      // Set session data
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };
     
      return res.json({
        success: true,
        user: {
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Password comparison error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

// Check if user is authenticated
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    return res.json({
      isLoggedIn: true,
      user: {
        username: req.session.user.username,
        role: req.session.user.role
      }
    });
  } else {
    return res.json({ isLoggedIn: false });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Books API routes
app.get('/api/books', (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
 
  // Get books from database
  db.all('SELECT * FROM BOOKS', [], (err, books) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
   
    res.json({ success: true, books });
  });
});

// Add book route (admin only)
app.post('/api/books', (req, res) => {
  // Check if user is authenticated and is an admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
 
  const { title, author, description, location } = req.body;
 
  // Insert book into database
  db.run(
    'INSERT INTO BOOKS (title, author, description, location, available) VALUES (?, ?, ?, ?, ?)',
    [title, author, description, location, true],
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
     
      res.json({
        success: true,
        book: {
          id: this.lastID,
          title,
          author,
          description,
          location,
          available: true
        }
      });
    }
  );
});

// Update book availability
app.put('/api/books/:id/availability', (req, res) => {
  // Check if user is authenticated and is an admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
 
  const bookId = req.params.id;
  const { available } = req.body;
 
  db.run(
    'UPDATE BOOKS SET available = ? WHERE id = ?',
    [available ? 1 : 0, bookId],
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
     
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }
     
      res.json({ success: true });
    }
  );
});

// Delete book
app.delete('/api/books/:id', (req, res) => {
  // Check if user is authenticated and is an admin
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
 
  const bookId = req.params.id;
 
  db.run(
    'DELETE FROM BOOKS WHERE id = ?',
    [bookId],
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
     
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }
     
      res.json({ success: true });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});