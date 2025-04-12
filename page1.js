document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const studentRoleBtn = document.getElementById('student-role-btn');
    const adminRoleBtn = document.getElementById('admin-role-btn');
    const adminField = document.querySelector('.admin-field');
    const loginForm = document.getElementById('login-form');
    const loginTitle = document.getElementById('login-title');
    
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
        const isAdmin = adminRoleBtn.classList.contains('active');
        
        // Simple validation
        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }
        
        // Check admin key if admin role is selected
        if (isAdmin) {
            const adminKey = document.getElementById('admin-key').value;
            if (!adminKey) {
                alert('Please enter the admin key');
                return;
            }
            
            // In a real application, you would validate the admin key on the server
            // For this example, we'll use a simple check
            if (adminKey !== 'admin123') {
                alert('Invalid admin key');
                return;
            }
        }
        
        // For demonstration purposes:
        // Store login info in localStorage (in a real app, this would be handled by server authentication)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', isAdmin ? 'admin' : 'student');
        
        // Redirect to welcome page
        window.location.href = 'page1.5.html';
    });
});