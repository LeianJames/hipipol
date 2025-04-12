// Variables to track pagination state
let currentPage = 1;
let itemsPerPage = 10; // Default items per page
let isAdmin = false; // Flag to check if admin mode is active
let books = []; // Will be populated from API

// DOM elements
const bookResultsContainer = document.getElementById('bookResults');
const paginationContainer = document.getElementById('paginationControls');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const totalResultsElement = document.getElementById('totalResults');
const userInfoElement = document.getElementById('user-info');

// Check user login status
function checkLoginStatus() {
  fetch('http://localhost:3000/api/check-auth', {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.isLoggedIn) {
      userInfoElement.innerHTML = `
        <div class="d-flex align-items-center">
          <span class="me-2">Welcome, ${data.user.username} (${data.user.role})</span>
          <button class="btn btn-sm btn-outline-secondary" id="logoutBtn">Logout</button>
        </div>
      `;
     
      // Add logout functionality
      document.getElementById('logoutBtn').addEventListener('click', function() {
        fetch('http://localhost:3000/api/logout', {
          method: 'POST',
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            window.location.href = 'page1.html';
          }
        })
        .catch(error => {
          console.error('Error logging out:', error);
        });
      });
     
      // Set admin mode if user is admin
      isAdmin = data.user.role === 'admin';
     
      // Load books
      loadBooks();
    } else {
      // If not logged in, redirect back to login page
      window.location.href = 'page1.html';
    }
  })
  .catch(error => {
    console.error('Error checking login status:', error);
    // If error, redirect to login
    window.location.href = 'page1.html';
  });
}

// Load books from API
function loadBooks() {
  fetch('http://localhost:3000/api/books', {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      books = data.books;
      updateTotalResults();
      renderBooks();
      renderPagination();
    } else {
      console.error('Failed to load books:', data.message);
    }
  })
  .catch(error => {
    console.error('Error loading books:', error);
  });
}

// Update total results count
function updateTotalResults() {
  totalResultsElement.textContent = books.length;
}

// Initialize with default settings
document.addEventListener('DOMContentLoaded', function() {
  // Check login status
  checkLoginStatus();
 
  // Set the default selected option for items per page
  itemsPerPageSelect.value = itemsPerPage;
 
  // Add event listener for items per page change
  itemsPerPageSelect.addEventListener('change', function() {
    itemsPerPage = parseInt(this.value);
    currentPage = 1; // Reset to first page when changing items per page
    renderBooks();
    renderPagination();
  });

  // Add admin controls if user is admin
  if (isAdmin) {
    // Add button for new book (will be added after login check)
    const addBookBtn = document.createElement('button');
    addBookBtn.innerHTML = 'Add New Book';
    addBookBtn.className = 'btn btn-success ms-2';
    addBookBtn.setAttribute('data-bs-toggle', 'modal');
    addBookBtn.setAttribute('data-bs-target', '#addBookModal');
    document.querySelector('.results-controls').appendChild(addBookBtn);
   
    // Add save book event listener
    document.getElementById('saveBookBtn').addEventListener('click', function() {
      addNewBook();
    });
  }

  // Create popup container
  const popupContainer = document.createElement('div');
  popupContainer.id = 'availabilityPopup';
  popupContainer.className = 'availability-popup';
  popupContainer.style.display = 'none';
  document.body.appendChild(popupContainer);
});

// Function to add a new book
function addNewBook() {
  // Get form values
  const title = document.getElementById('bookTitle').value;
  const author = document.getElementById('bookAuthor').value;
  const description = document.getElementById('bookDescription').value;
  const location = document.getElementById('bookLocation').value;
 
  // Validate form
  if (!title || !author || !description) {
    alert('Please fill in all required fields');
    return;
  }
 
  // Send request to API
  fetch('http://localhost:3000/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      title,
      author,
      description: description ? `Book - ${description};` : 'Book;',
      location: location || 'Nova Schola Main Library'
    }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Add book to array
      books.push(data.book);
     
      // Update total results count
      updateTotalResults();
     
      // Re-render books list
      renderBooks();
      renderPagination();
     
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
      modal.hide();
     
      // Clear form
      document.getElementById('addBookForm').reset();
    } else {
      alert(data.message || 'Failed to add book');
    }
  })
  .catch(error => {
    console.error('Error adding book:', error);
    alert('An error occurred while adding the book');
  });
}

// Rest of your functions (renderBooks, renderPagination, etc.)
// ...