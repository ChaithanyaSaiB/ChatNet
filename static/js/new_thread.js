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
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    if (response.status === 401) {
                        throw response; // Throw the response as is for unauthorized errors
                    } else {
                        // For all other errors, prepend a message and include the original error details
                        return response.text().then(errorText => {
                            let errorMessage = "Failed to create new thread. ";
                            try {
                                // Try to parse the error text as JSON
                                const errorJson = JSON.parse(errorText);
                                errorMessage += errorJson.detail || errorText;
                            } catch (e) {
                                // If parsing fails, use the error text as is
                                errorMessage += errorText;
                            }
                            throw new Error(errorMessage);
                        });
                    }
                }
                
            })
            .catch(error => {
                window.errorDisplayForChatPane(error);
            });
        }
        else
        {
            alert("OOPS! We need something to start the conversation..");
        }
        
    }
    sendButton.addEventListener('click', processInput);
});
