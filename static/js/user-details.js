// --- Authentication Elements ---
const loginButton = document.querySelector('.login-button');
const usernameDisplay = document.querySelector('.username-display');
const logoutButton = document.querySelector('.logout-button');

/**
 * Logs out the current user by making a POST request to the '/logout' endpoint.
 * Upon successful logout, redirects the user to the login page.
 */
function logout() {
    fetch('/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.href = "/login";
    })
    .catch(error => console.error('Error getting user info:', error));
}

/**
 * Loads chat threads for a specific user from the server.
 * If no user ID is provided, displays a message prompting the user to log in.
 *
 * @param {string} userId - The ID of the user whose threads are to be loaded.
 */
function loadThreads(userId) {
    if (userId) {
        fetch('/list_threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({'user_id': userId})
        })
        .then(response => response.json())
        .then(threads => {
            const threadList = document.querySelector('.thread-list');
            threadList.innerHTML = '';
            if (threads.length === 0) {
                const emptyMessage = document.createElement('li');
                emptyMessage.textContent = 'No threads found. Start a new conversation!';
                emptyMessage.className = 'empty-thread-message';
                threadList.appendChild(emptyMessage);
            } else {
                threads.forEach(thread => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="/thread?thread_id=${thread.thread_id}" class="thread-item">${thread.title}</a>`;
                    threadList.appendChild(li);
                });
            }
        })
        .catch(error => console.error('Error loading threads:', error));
    }
    else
    {
        const threadList = document.querySelector('.thread-list');
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Login to see your threads!';
        emptyMessage.className = 'empty-thread-message';
        threadList.appendChild(emptyMessage);
    }
}

/**
     * Capitalizes the first letter of a string.
     *
     * @param {string} str - The string to capitalize.
     * @returns {string} The capitalized string.
     */
function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Fetches user information from the '/me' endpoint and updates the UI accordingly.
 * If the user is logged in, displays a welcome message and loads the user's chat threads.
 * If the user is not logged in, prompts the user to log in.
 */
fetch('/me', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
})
.then(response => response.json())
.then(user => {
    if (user.username) {
        loginButton.style.display = 'none';
        usernameDisplay.textContent = "Welcome " + capitalizeString(user.username) + " !";
        usernameDisplay.style.display = 'flex';
        logoutButton.style.display = 'flex';
        loadThreads(user.user_id);
    }
    else
    {
        loadThreads(null)
    }
})
.catch(error => console.error('Error getting user info:', error));