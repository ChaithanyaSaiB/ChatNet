document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const usernameDisplay = document.querySelector('.username-display');

    function capitalizeString(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const chatInput = document.getElementById('user-input');
    const sendButton = document.querySelector('#send-button');

    chatInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendButton.click();
        }
    });

    // function scrollToBottom() {
    //     const chatArea = document.getElementById('chat-area');
    //     chatArea.scrollTo({
    //       top: chatArea.scrollHeight,
    //       behavior: 'smooth'
    //     });
    // }
      
    // scrollToBottom();    
    // const lastElement = document.body.lastElementChild;
    // lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });

    window.scrollToQuery = function() {
        const chatArea = document.getElementById('chat-area');
        // const targetQuery = document.querySelector(`.query .query_id[data-value="${queryId}"]`).closest('.query');
        const queries = document.querySelectorAll('.query');
        const targetQuery = queries[queries.length - 1];

        if (!chatArea || !targetQuery) return;
      
        // Calculate the height of the chat area
        const chatAreaHeight = chatArea.clientHeight;
        
        // Get the position of the target query relative to the chat area
        const targetRect = targetQuery.getBoundingClientRect();
        const chatAreaRect = chatArea.getBoundingClientRect();
        const relativeTop = targetRect.top - chatAreaRect.top;
      
        // Calculate the required scroll position
        let newScrollTop = chatArea.scrollTop + relativeTop;
      
        // Check if we need to add extra space at the bottom
        const remainingSpace = chatAreaHeight - targetRect.height;
        if (remainingSpace > 0) {
          const extraSpace = document.createElement('div');
          extraSpace.style.height = `${remainingSpace}px`;
          chatArea.appendChild(extraSpace);
        }
      
        // Scroll to the target query
        chatArea.scrollTop = newScrollTop;
      
        // Optional: Smooth scroll animation
        // chatArea.scrollTo({
        //   top: newScrollTop,
        //   behavior: 'smooth'
        // });
    }

    // Include Marked.js library (https://github.com/markedjs/marked)
    window.renderMarkdown = function() {
        console.log("render markdown");
        const responseElements = document.querySelectorAll('.markdown-body');
        console.log(responseElements);
        responseElements.forEach(element => {
            element.innerHTML = marked.parse(element.textContent);
            console.log(marked.parse(element.textContent));
            console.log(element.innerHTML);
        });
    }

    window.errorDisplayForChatPane = function(error) {
        if (error instanceof Response) 
        {
            console.log("entered error display for chat pane");
            console.log(error);
            // It's an HTTP error, likely containing HTML
            error.text().then(errorHtml => {
                let chatPane = document.querySelector('.chat-pane');
                chatPane.innerHTML = errorHtml;
    
                const scripts = chatPane.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent; // Copy script content
                    document.body.appendChild(newScript); // Append it to the body
                    document.body.removeChild(newScript); // Clean up after execution
                });
    
                const statusCode = error.status;
                errorComponent.init(statusCode);
            });
        }
        else 
        {
            // It's a different kind of error
            let chatPane = document.querySelector('.chat-pane');
            chatPane.textContent = 'An unexpected error occurred: ' + error.message;
        }
    }

    // Call this function after the content is loaded/updated
    
    renderMarkdown();
    scrollToQuery();

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
