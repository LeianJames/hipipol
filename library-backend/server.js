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
  origin: 'http://localhost:5500', // Change to your frontend URL
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key', // Change this to a random string
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

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
   
    // In a real application, we would compare hashed passwords
    // This is a placeholder for demonstration
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});