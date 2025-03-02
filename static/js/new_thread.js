document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');

    function processInput() {
        const userInput = document.getElementById('user-input').value;
        if (userInput != "")
        {
            document.getElementById('user-input').value = '';
            fetch('/new_thread', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({query: userInput}),
                redirect: 'follow'
            })
            .then(response => {
                if (response.status === 401) {
                    throw new Error('Unauthorized: Please log in again.');
                }
                else if (response.redirected) {
                    // Redirect properly
                    window.location.href = response.url;
                }
                else if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.detail || "Failed to create new thread."); });
                }
            })
            .catch(error => {
                console.error('Error:', error);

                // Display error message to user
                let chatPane = document.querySelector('.chat-pane');
                chatPane.innerHTML = `
                    <div class="error-message">
                        <h2>An error occurred</h2>
                        <p>${error.message}</p>
                    </div>
                `;
                
                // If it's an authentication error, you might want to redirect to login page
                if (error.message.includes('Unauthorized')) {
                    setTimeout(() => {
                        window.location.href = '/login'; // Adjust this URL as needed
                    }, 3000); // Redirect after 3 seconds
                }
            });
        }
        else
        {
            alert("OOPS! We need something to start the conversation..");
        }
        
    }
    sendButton.addEventListener('click', processInput);
});
