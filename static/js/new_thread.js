document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');

    function processInput() {
        const userInput = document.getElementById('user-input').value;
        document.getElementById('user-input').value = '';
        fetch('/new_thread', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('access_token')}`
            },
            body: JSON.stringify({query: userInput}),
            redirect: 'follow'
        })
        .then(response => {
            if (response.redirected) {
                // Redirect properly
                window.location.href = response.url;
            } 
            else if (!response.ok) {
                return response.json().then(err => { throw new Error(err.detail || "Failed to create new thread."); });
            }
        })
        .catch(error => {
            //console.error('Error:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message, error.stack);
            } else {
                console.error('Unexpected error:', JSON.stringify(error, null, 2));
            }
            alert('Failed to create new thread. Please try again.');
        });
        
    }
    sendButton.addEventListener('click', processInput);
});
