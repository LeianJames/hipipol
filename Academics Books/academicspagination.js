// Variables to track pagination state
let currentPage = 1;
let itemsPerPage = 10; // Default items per page
let isAdmin = false; // Flag to check if admin mode is active

// DOM elements
const bookResultsContainer = document.getElementById('bookResults');
const paginationContainer = document.getElementById('paginationControls');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const totalResultsElement = document.getElementById('totalResults');
const userInfoElement = document.getElementById('user-info');

// Check user login status
function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole') || 'guest';
  const username = localStorage.getItem('username') || 'Guest';
  
  // Update UI based on login status
  if (isLoggedIn) {
    userInfoElement.innerHTML = `
      <div class="d-flex align-items-center">
        <span class="me-2">Welcome, ${username} (${userRole})</span>
        <button class="btn btn-sm btn-outline-secondary" id="logoutBtn">Logout</button>
      </div>
    `;
    
    // Add logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      window.location.href = '../page1.html';
    });
    
    // Set admin mode if user is admin
    isAdmin = userRole === 'admin';
  } else {
    userInfoElement.innerHTML = `
      <a href="../page1.html" class="btn btn-sm btn-outline-primary">Login</a>
    `;
  }
}

// Update total results count
function updateTotalResults() {
  totalResultsElement.textContent = books.length;
}

// Initialize with default settings
document.addEventListener('DOMContentLoaded', function() {
  // Check login status
  checkLoginStatus();
  
  // Update total results count
  updateTotalResults();
  
  // Set the default selected option for items per page
  itemsPerPageSelect.value = itemsPerPage;
  
  // Initial render
  renderBooks();
  renderPagination();
  
  // Add event listener for items per page change
  itemsPerPageSelect.addEventListener('change', function() {
    itemsPerPage = parseInt(this.value);
    currentPage = 1; // Reset to first page when changing items per page
    renderBooks();
    renderPagination();
  });

  // Add admin controls if user is admin
  if (isAdmin) {
    // Add button for new book
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
  
  // Create new book object
  const newBook = {
    id: books.length + 1,
    title: title,
    author: author,
    description: description ? `Book - ${description};` : 'Book;',
    location: location || 'Nova Schola Main Library',
    available: true
  };
  
  // Add book to array
  books.push(newBook);
  
  // Save books data
  saveBooks();
  
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
}

// Function to remove a book
function removeBook(bookId) {
  if (confirm('Are you sure you want to remove this book?')) {
    const bookIndex = books.findIndex(book => book.id === bookId);
    if (bookIndex !== -1) {
      books.splice(bookIndex, 1);
      saveBooks();
      updateTotalResults();
      renderBooks();
      renderPagination();
    }
  }
}

// Function to show availability popup
function showAvailabilityPopup(book) {
  const popup = document.getElementById('availabilityPopup');
  
  // Create popup content
  popup.innerHTML = `
    <div class="popup-content">
      <span class="close-popup">&times;</span>
      <h3>${book.title}</h3>
      <p><strong>Status:</strong> ${book.available ? 'Available' : 'Not Available'}</p>
      <p><strong>Location:</strong> ${book.location}</p>
      ${book.available ? 
        '<p>You can check out this book at the library desk.</p>' : 
        '<p>This book is currently checked out. Please check back later.</p>'}
    </div>
  `;
  
  // Add close button functionality
  popup.querySelector('.close-popup').addEventListener('click', function() {
    popup.style.display = 'none';
  });
  
  // Display the popup
  popup.style.display = 'block';
  
  // Close popup when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target == popup) {
      popup.style.display = 'none';
    }
  });
}

// Function to toggle book availability (admin only)
function toggleAvailability(bookId) {
  if (!isAdmin) return;
  
  const bookIndex = books.findIndex(book => book.id === bookId);
  if (bookIndex !== -1) {
    books[bookIndex].available = !books[bookIndex].available;
    saveBooks(); // Save the updated availability status
    renderBooks(); // Re-render the books list
  }
}

// Function to display books based on current page and items per page
function renderBooks() {
  // Clear current results
  bookResultsContainer.innerHTML = '';
  
  // Calculate start and end indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, books.length);
  
  // Generate HTML for each book in the current page
  for (let i = startIndex; i < endIndex; i++) {
    const book = books[i];
    const bookElement = document.createElement('div');
    bookElement.className = 'result-item';
    
    let actionsHtml = '';
    if (isAdmin) {
      // Admin view with toggle and remove options
      actionsHtml = `
        <button class="toggle-availability btn btn-sm btn-warning me-2" data-book-id="${book.id}">
          ${book.available ? 'Mark as Unavailable' : 'Mark as Available'}
        </button>
        <button class="remove-book btn btn-sm btn-danger me-2" data-book-id="${book.id}">
          Remove Book
        </button>
        <span class="library-location">${book.location}</span>
      `;
    } else {
      // Regular user or student view
      const userRole = localStorage.getItem('userRole') || 'guest';
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (userRole === 'student' && isLoggedIn) {
        // Student view - no availability button
        actionsHtml = `
          <span class="library-location">${book.location}</span>
          <span class="ms-2 badge ${book.available ? 'bg-success' : 'bg-danger'}">
            ${book.available ? 'Available' : 'Not Available'}
          </span>
        `;
      } else {
        // Guest view - with availability button
        actionsHtml = `
          <button class="check-availability btn btn-sm btn-primary me-2" data-book-id="${book.id}">Check availability</button>
          <span class="library-location">${book.location}</span>
        `;
      }
    }
    
    bookElement.innerHTML = `
      <div class="result-number">${i + 1}</div>
      <div class="result-details">
        <h3 class="result-title">${book.title}</h3>
        <p class="result-author">${book.author}</p>
        ${book.publication ? `<p class="result-publication">${book.publication}</p>` : ''}
        <p class="result-description">${book.description}</p>
        <div class="result-actions">
          ${actionsHtml}
        </div>
      </div>
    `;
    
    bookResultsContainer.appendChild(bookElement);
  }
  
  // Add event listeners for buttons
  if (isAdmin) {
    document.querySelectorAll('.toggle-availability').forEach(button => {
      button.addEventListener('click', function() {
        const bookId = parseInt(this.getAttribute('data-book-id'));
        toggleAvailability(bookId);
      });
    });
    
    document.querySelectorAll('.remove-book').forEach(button => {
      button.addEventListener('click', function() {
        const bookId = parseInt(this.getAttribute('data-book-id'));
        removeBook(bookId);
      });
    });
  } else {
    document.querySelectorAll('.check-availability').forEach(button => {
      button.addEventListener('click', function() {
        const bookId = parseInt(this.getAttribute('data-book-id'));
        const book = books.find(b => b.id === bookId);
        if (book) {
          showAvailabilityPopup(book);
        }
      });
    });
  }
}

// Function to render pagination controls
function renderPagination() {
  // Clear current pagination
  paginationContainer.innerHTML = '';
  
  // Calculate total pages
  const totalPages = Math.ceil(books.length / itemsPerPage);
  
  // Add previous button if not on first page
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '← Previous';
    prevButton.addEventListener('click', function() {
      currentPage--;
      renderBooks();
      renderPagination();
    });
    paginationContainer.appendChild(prevButton);
  }
  
  // Add page number buttons
  // For simplicity, show max 5 page numbers
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.innerHTML = i;
    
    if (i === currentPage) {
      pageButton.className = 'active';
    }
    
    pageButton.addEventListener('click', function() {
      currentPage = i;
      renderBooks();
      renderPagination();
    });
    
    paginationContainer.appendChild(pageButton);
  }
  
  // Add next button if not on last page
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Next →';
    nextButton.addEventListener('click', function() {
      currentPage++;
      renderBooks();
      renderPagination();
    });
    paginationContainer.appendChild(nextButton);
  }
  
  // Add a simple text showing current range of items
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, books.length);
  
  const rangeInfo = document.createElement('span');
  rangeInfo.className = 'page-info';
  rangeInfo.innerHTML = `Showing ${startItem}-${endItem} of ${books.length}`;
  paginationContainer.appendChild(rangeInfo);
}

// Function to navigate to a specific page
function goToPage(pageNumber) {
  currentPage = pageNumber;
  renderBooks();
  renderPagination();
}