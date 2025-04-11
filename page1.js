// Enhanced login function for page1.js
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const loginForm = document.querySelector('form');
    
    // Get role from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role') || 'student';
    
    // Update the login page title based on role
    const loginTitle = document.querySelector('h2');
    if (loginTitle) {
        loginTitle.textContent = userRole === 'admin' ? 'Administrator Login' : 'Student Login';
    }
    
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
        
        // Store user role in localStorage
        localStorage.setItem('userRole', userRole);
        
        // In a real application, you would verify credentials with a server
        // For this demo, redirect to the library page
        window.location.href = 'page2renovation.html';
    });
});