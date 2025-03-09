/**
 * @file This script handles new thread creation by processing user input from the chat interface.
 */

document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');

    /**
     * Processes user input and initiates new thread creation.
     * Validates input, sends POST request to '/new_thread', and handles response/errors.
     * Clears input field after submission and manages redirects/error display.
     */
    function processInput() {
        const userInput = document.getElementById('user-input').value;
        if (userInput != "") {
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
                        throw response;
                    } else {
                        return response.text().then(errorText => {
                            let errorMessage = "Failed to create new thread. ";
                            try {
                                const errorJson = JSON.parse(errorText);
                                errorMessage += errorJson.detail || errorText;
                            } catch (e) {
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
        else {
            alert("OOPS! We need something to start the conversation..");
        }
    }

    /**
     * Event listener for send button clicks.
     * Triggers the thread creation process when the button is clicked.
     */
    sendButton.addEventListener('click', processInput);
});
