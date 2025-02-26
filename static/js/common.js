document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const usernameDisplay = document.querySelector('.username-display');

    window.getUserDetailFromToken = function(name) {
        const token = localStorage.getItem("access_token");
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));  // Decode JWT payload
            return payload[name];  // Use dynamic key access
        } catch (error) {
            console.error("Invalid token:", error);
            return null;
        }
    }

    function logout() {
        localStorage.removeItem("access_token");
        loginButton.style.display = 'flex';
        logoutButton.style.display = 'none';
        usernameDisplay.textContent = '';
        usernameDisplay.style.display = 'none';
        window.location.reload();
    }

    function loadThreads() {
        const userId = getUserDetailFromToken('user_id');
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
    }

    const username = getUserDetailFromToken('username');
    if (username) {
        loginButton.style.display = 'none';
        usernameDisplay.textContent = username;
        usernameDisplay.style.display = 'flex';
        logoutButton.style.display = 'flex';
        loadThreads();
    }

    logoutButton.addEventListener('click', logout);

    const userInput = document.querySelector("#user-input");
    const defaultHeight = "40px";
    const maxHeight = "120px";

    function adjustHeight() {
        userInput.style.height = defaultHeight;
        userInput.style.height = Math.min(userInput.scrollHeight, parseInt(maxHeight)) + "px";
    }

    userInput.addEventListener("input", adjustHeight);

    userInput.addEventListener("focus", adjustHeight);

    userInput.addEventListener("blur", function () {
        userInput.style.height = defaultHeight;
    });
});
