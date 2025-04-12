// Enhanced login function for page1.js
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const loginForm = document.getElementById('login-form');
    const loginTitle = document.getElementById('login-title');
    const studentRoleBtn = document.getElementById('student-role-btn');
    const adminRoleBtn = document.getElementById('admin-role-btn');
    const adminField = document.querySelector('.admin-field');
    
    // Default role
    let currentRole = 'student';
    
    // Role button event listeners
    studentRoleBtn.addEventListener('click', function() {
        setRole('student');
    });
    
    adminRoleBtn.addEventListener('click', function() {
        setRole('admin');
    });
    
    // Function to set the current role
    function setRole(role) {
        currentRole = role;
        
        // Update UI
        if (role === 'student') {
            loginTitle.textContent = 'Student Login';
            studentRoleBtn.classList.add('active');
            adminRoleBtn.classList.remove('active');
            adminField.style.display = 'none';
        } else {
            loginTitle.textContent = 'Administrator Login';
            adminRoleBtn.classList.add('active');
            studentRoleBtn.classList.remove('active');
            adminField.style.display = 'block';
        }
    }
    
    // Get role from URL parameters (for backward compatibility)
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('role');
    if (urlRole === 'admin') {
        setRole('admin');
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
        
        // Check admin key if role is admin
        if (currentRole === 'admin') {
            const adminKey = document.getElementById('admin-key').value;
            if (adminKey.trim() === '') {
                alert('Please enter the admin key');
                return;
            }
            
            // In a real application, you would verify the admin key with a server
            // For this demo, we'll use a simple hardcoded value
            if (adminKey !== 'admin123') {
                alert('Invalid admin key');
                return;
            }
        }
        
        // Store user credentials in localStorage (in a real app, you'd use secure methods)
        localStorage.setItem('userRole', currentRole);
        localStorage.setItem('username', username);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to the library page
        window.location.href = 'page2renovation.html';
    });
});