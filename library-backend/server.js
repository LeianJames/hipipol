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
  origin: 'http://127.0.0.1:5500/page1.html', // Update this to match your front-end URL
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: 'NSTLibrarySecretKey2025', // More secure secret key
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connect to SQLite database with consistent path
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  // Create USERS table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS USERS (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
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
          // Create default admin and student users with bcrypt hashed passwords
          try {
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
           
          } catch (error) {
            console.error('Error hashing passwords:', error);
          }
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
          // Sample books to add if no books exist
          const sampleBooks = [
            {
              title: "Carbon Jargon: Making Sense of the Life Science of Climate Change",
              author: "Various Authors",
              description: "Book - 159 pages;",
              location: "Nova Schola Main Library",
              available: true
            },
            {
              title: "General Ecology",
              author: "David T. Krohne",
              description: "Book - 505 pages;",
              location: "Nova Schola Main Library",
              available: true
            },
            {
              title: "Introduction to Database Systems",
              author: "C.J. Date",
              description: "Book - 970 pages;",
              location: "Nova Schola Main Library",
              available: true
            },
            {
              title: "Web Development with Node.js",
              author: "David Herron",
              description: "Book - 340 pages;",
              location: "Nova Schola Main Library",
              available: true
            }
          ];
         
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

// Auth middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
}

// Admin middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized' });
  }
}

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// API Routes

// Login route
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
 
  // Validate input
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
 
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
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Books API routes
app.get('/api/books', isAuthenticated, (req, res) => {
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
app.post('/api/books', isAdmin, (req, res) => {
  const { title, author, description, location } = req.body;
 
  // Validate input
  if (!title || !author) {
    return res.status(400).json({ success: false, message: 'Title and author are required' });
  }
 
  // Insert book into database
  db.run(
    'INSERT INTO BOOKS (title, author, description, location, available) VALUES (?, ?, ?, ?, ?)',
    [title, author, description || '', location || '', true],
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
          description: description || '',
          location: location || '',
          available: true
        }
      });
    }
  );
});

// Update book availability
app.put('/api/books/:id/availability', isAdmin, (req, res) => {
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
app.delete('/api/books/:id', isAdmin, (req, res) => {
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

// Search books
app.get('/api/books/search', isAuthenticated, (req, res) => {
  const { query, field } = req.query;
 
  if (!query) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }
 
  let sql = 'SELECT * FROM BOOKS WHERE ';
 
  // Add search condition based on field
  if (field === 'title') {
    sql += 'title LIKE ?';
  } else if (field === 'author') {
    sql += 'author LIKE ?';
  } else {
    // Default: search in all fields
    sql += 'title LIKE ? OR author LIKE ? OR description LIKE ?';
  }
 
  const searchParam = `%${query}%`;
  const params = field === 'title' || field === 'author' ?
    [searchParam] : [searchParam, searchParam, searchParam];
 
  db.all(sql, params, (err, books) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
   
    res.json({ success: true, books });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});