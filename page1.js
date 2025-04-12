document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const studentRoleBtn = document.getElementById('student-role-btn');
    const adminRoleBtn = document.getElementById('admin-role-btn');
    const adminField = document.querySelector('.admin-field');
    const loginForm = document.getElementById('login-form');
    const loginTitle = document.getElementById('login-title');
   
    // Check if user is already logged in
    checkAuthStatus();
   
    // Role selection
    studentRoleBtn.addEventListener('click', function() {
        studentRoleBtn.classList.add('active');
        adminRoleBtn.classList.remove('active');
        adminField.style.display = 'none';
        loginTitle.textContent = 'Student Login';
    });
   
    adminRoleBtn.addEventListener('click', function() {
        adminRoleBtn.classList.add('active');
        studentRoleBtn.classList.remove('active');
        adminField.style.display = 'block';
        loginTitle.textContent = 'Administrator Login';
    });
   
    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
       
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = adminRoleBtn.classList.contains('active') ? 'admin' : 'student';
       
        // Simple validation
        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }
       
        // Check admin key if admin role is selected
        if (role === 'admin') {
            const adminKey = document.getElementById('admin-key').value;
            if (!adminKey) {
                alert('Please enter the admin key');
                return;
            }
           
            // Simple admin key validation
            if (adminKey !== 'admin123') {
                alert('Invalid admin key');
                return;
            }
        }
       
        // Login with the API
        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for sending cookies
            body: JSON.stringify({
                username,
                password,
                role
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect to welcome page
                window.location.href = 'page1.5.html';
            } else {
                alert(data.message || 'Login failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during login');
        });
    });
   
    // Function to check if the user is authenticated
    function checkAuthStatus() {
        fetch('http://localhost:3000/api/check-auth', {
            method: 'GET',
            credentials: 'include' // Important for sending cookies
        })
        .then(response => response.json())
        .then(data => {
            if (data.isLoggedIn) {
                // User is already logged in, redirect to welcome page
                window.location.href = 'page1.5.html';
            }
        })
        .catch(error => {
            console.error('Error checking auth status:', error);
        });
    }
});