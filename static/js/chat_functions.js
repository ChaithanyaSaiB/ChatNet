const chatArea = document.getElementById('chat-area');
const queryTitle = document.getElementById('query-title');
const responseText = document.getElementById('response-text');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(message, isUser) {
    if (isUser == true)
    {
        queryTitle.textContent = message;
    }
    else
    {
        responseText.textContent = message;
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);
        userInput.value = '';
        
        fetch('/response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            addMessage(data.response, false);
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('An error occurred. Please try again.', false);
        });
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});