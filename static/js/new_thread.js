document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');

    function processInput() {
        const userInput = document.getElementById('user-input').value;
        fetch('/new_thread', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({user_id: getCookie('user_id'), query: userInput})
        })
        .then(response => response.text())
        .then(html => {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create new thread. Please try again.');
        });        
    }

    sendButton.addEventListener('click', processInput);
});
