document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');

    function processInput() {
        const userInput = document.getElementById('user-input').value;
        
        document.getElementById('user-input').value = '';
      
        fetch('/new_thread', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({user_id: getCookie('user_id'), query: userInput})
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                throw new Error('Expected a redirect response');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create new thread. Please try again.');
        });
    }
    sendButton.addEventListener('click', processInput);
});
