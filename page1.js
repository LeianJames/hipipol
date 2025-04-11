// Simplified login function for page1.js
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const loginForm = document.querySelector('form');
    
    // Form submission handling
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission
        
        // Get username and password values
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Basic validation - check if fields are not empty
        if (username.trim() === '' || password.trim() === '') {
            alert('Please enter both username and password');
            return;
        }
        
        // Simple login - in real applications, you would verify credentials with a server
        // For this example, we'll just redirect to the library page
        window.location.href = 'page1.5.html';
    });
});