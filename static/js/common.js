document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const usernameDisplay = document.querySelector('.username-display');

    window.getCookie = function(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };   

    function logout() {
        document.cookie = "user_id=; path=/; max-age=0;";
        document.cookie = "username=; path=/; max-age=0;";
        loginButton.style.display = 'flex';
        logoutButton.style.display = 'none';
        usernameDisplay.textContent = '';
        usernameDisplay.style.display = 'none';
        window.location.reload();
    }

    function loadThreads() {
        const userId = getCookie('user_id');
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

    const username = getCookie('username');
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
