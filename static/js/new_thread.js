document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const usernameDisplay = document.querySelector('.username-display');
    const sendButton = document.getElementById('send-button');

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
    
    function processInput() {
        const userInput = document.getElementById('user-input').value;

        fetch('/new_thread', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({user_id: getCookie('user_id'), query: userInput})
        })
        .then(response => response.text())  // Change this line from response.json() to response.text()
        .then(html => {
            // Replace the current page content with the received HTML
            document.open();
            document.write(html);
            document.close();
            // Update the URL without reloading the page
            //history.pushState({}, '', '/thread/' + new URLSearchParams(html).get('thread_id'));
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create new thread. Please try again.');
        });        
    }

    function loadThreads() {
        const userId = getCookie('user_id');
        if (userId) {
            fetch('/list_threads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({'user_id': userId})
            })
            .then(response => response.json())
            .then(threads => {
                const threadList = document.querySelector('.thread-list');
                threadList.innerHTML = ''; // Clear existing threads
                threads.forEach(thread => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="/thread/${thread.thread_id}" class="thread-item">${thread.title}</a>`;
                    threadList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error loading threads:', error);
            });
        }
    }
    
    const userId = getCookie('user_id');
    if (userId) {
        loadThreads();
    }

    sendButton.addEventListener('click', processInput);
});
