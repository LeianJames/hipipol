document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || 'Guest';
    const userRole = localStorage.getItem('userRole') || 'guest';
    
    // Update greeting with username
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) {
        userGreeting.textContent = username;
    }
    
    // Update user info in navbar
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
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
                window.location.href = 'page1.html';
            });
        } else {
            // If not logged in, redirect back to login page
            window.location.href = 'page1.html';
        }
    }
});