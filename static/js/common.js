document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const usernameDisplay = document.querySelector('.username-display');

    function capitalizeString(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function logout() {

        fetch('/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            window.location.href = "/";
        })
        .catch(error => console.error('Error getting user info:', error));
        
        // loginButton.style.display = 'flex';
        // logoutButton.style.display = 'none';
        // usernameDisplay.textContent = '';
        // usernameDisplay.style.display = 'none';
        // window.location.reload();
    }

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
