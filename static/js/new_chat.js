document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const usernameDisplay = document.querySelector('.username-display');

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function logout() {
        // Clear cookies client-side
        document.cookie = "user_id=; path=/; max-age=0;"; // Expires immediately
        document.cookie = "username=; path=/; max-age=0;"; // Expires immediately

        // Update UI: Show login button, hide logout button, clear username
        loginButton.style.display = 'flex';
        logoutButton.style.display = 'none';
        usernameDisplay.textContent = '';
        usernameDisplay.style.display = 'none';

        // Reload the page
        window.location.reload();
    }

    const username = getCookie('username');
    if (username) {
        loginButton.style.display = 'none';
        usernameDisplay.textContent = username;
        usernameDisplay.style.display = 'flex';
        logoutButton.style.display = 'flex';
    }

    logoutButton.addEventListener('click', logout);
});
