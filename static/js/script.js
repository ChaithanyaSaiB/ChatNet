/**
 * @file This script manages user authentication, chat functionalities,
 * and thread loading in the ChatNet application.
 */

document.addEventListener('DOMContentLoaded', function() {
    // --- Authentication Elements ---
    const logoutButton = document.querySelector('.logout-button');
    
    /**
     * Scrolls the chat area to display the most recent query.
     * This function calculates the appropriate scroll position to ensure
     * that the latest query is visible in the chat area.
     */
    window.scrollToQuery = function() {
        const chatArea = document.getElementById('chat-area');
        const queries = document.querySelectorAll('.query');
        const targetQuery = queries[queries.length - 1];
    
        if (!chatArea || !targetQuery) return;
    
        const chatAreaHeight = chatArea.clientHeight;
        const targetRect = targetQuery.getBoundingClientRect();
        const chatAreaRect = chatArea.getBoundingClientRect();
        const relativeTop = targetRect.top - chatAreaRect.top;
        let newScrollTop = chatArea.scrollTop + relativeTop;
    
        // Adjust scroll position to keep the target query visible at the bottom
        if (targetRect.height > chatAreaHeight) {
            newScrollTop = targetArea.scrollHeight;
    
        } else if (newScrollTop + targetRect.height > chatArea.scrollHeight){
            newScrollTop = chatArea.scrollHeight - chatAreaHeight;
        }
    
        chatArea.scrollTop = newScrollTop;
    };    

    /**
     * Renders Markdown content in elements with the class 'markdown-body'.
     * This function uses the Marked.js library to parse Markdown syntax
     * and update the inner HTML of the selected elements.
     */
    window.renderMarkdown = function() {
        const responseElements = document.querySelectorAll('.markdown-body');
        responseElements.forEach(element => {
            element.innerHTML = marked.parse(element.textContent);
        });
    }

    /**
     * Displays error messages in the chat pane.
     * Handles different types of errors, including HTTP errors and unexpected exceptions.
     *
     * @param {Error|Response} error - The error object or HTTP response.
     */
    window.errorDisplayForChatPane = function(error) {
        if (error instanceof Response) 
        {
            error.text().then(errorHtml => {
                let chatPane = document.querySelector('.chat-pane');
                chatPane.innerHTML = errorHtml;
    
                const scripts = chatPane.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                    document.body.removeChild(newScript);
                });
    
                const statusCode = error.status;
                errorComponent.init(statusCode);
            });
        }
        else 
        {
            let chatPane = document.querySelector('.chat-pane');
            chatPane.textContent = 'An unexpected error occurred: ' + error.message;
        }
    }

    /**
     * Constructs a dynamic URL with thread ID, query IDs, and format options.
     *
     * @param {number} threadId - The ID of the thread.
     * @param {number|number[]} queryIds - The ID or array of IDs of the queries.
     * @param {boolean} json - Whether the URL should request a JSON response.
     * @param {number[]} justQueryIds - Array of query IDs to include specifically.
     * @returns {string} The constructed URL.
     */
    window.buildDynamicURL = function(threadId, queryIds, json, justQueryIds=null) {
        const baseURL = '/thread?thread_id=' + threadId;
        let queryParams = '';

        if (Array.isArray(queryIds)) {
            queryParams = queryIds.map(id => 'query_id=' + id).join('&');
        } 
        else if (queryIds !== undefined && queryIds !== null) {
            queryParams = 'query_id=' + queryIds;
        }
        else console.error('Invalid query ID(s) provided:', queryIds);

        let justQueryParams = '';

        if (Array.isArray(justQueryIds)) {
            justQueryParams = justQueryIds.map(id => 'just_query_id=' + id).join('&');
        }
        else {
            justQueryParams = 'just_query_id=' + justQueryIds;
        }

        if (json) 
            if(justQueryIds) {
                return baseURL + (queryParams ? '&' + queryParams : '') + (justQueryParams ? '&' + justQueryParams : '') + '&json_response_format=true';
            }
            else {
                return baseURL + (queryParams ? '&' + queryParams : '') + '&json_response_format=true';
            }
        else {
            if(justQueryIds) {
                return baseURL + (queryParams ? '&' + queryParams : '') + (justQueryParams ? '&' + justQueryParams : '');
            }
            else {
                return baseURL + (queryParams ? '&' + queryParams : '');
            }
        }
    }

    // --- Initial Render Calls ---    
    renderMarkdown();
    scrollToQuery();

    /**
     * Initializes the chat input functionality, including event listeners and height adjustment.
     * This function can be called to reattach or reinitialize the chat input as needed.
     */
    window.initializeChatInput = function() {        
        const chatInput = document.getElementById('user-input');
        const sendButton = document.querySelector('#send-button');
        
        if (!chatInput) {
            console.error("Chat input element not found!");
            return;
        }
        
        if (!sendButton) {
            console.error("Send button element not found!");
            return;
        }

        const defaultHeight = "40px";
        const maxHeight = "120px";

        /**
         * Adjusts the height of the user input field based on its content.
         */
        function adjustHeight() {
            chatInput.style.height = "auto";
            chatInput.style.height = Math.min(chatInput.scrollHeight, parseInt(maxHeight)) + "px";
        }

        /**
         * Event listener for the chat input to handle Enter and Shift+Enter key presses.
         * 
         * @param {KeyboardEvent} event - The keydown event object.
         */
        function handleKeyDown(event) {
            if (event.key === 'Enter') {
                if (event.shiftKey) {
                    const cursorPosition = chatInput.selectionStart;
                    chatInput.value =
                        chatInput.value.slice(0, cursorPosition) +
                        '\n' +
                        chatInput.value.slice(cursorPosition);
                    event.preventDefault();
                } else {
                    event.preventDefault();
                    sendButton.click();
                }
            }
        }

        /**
         * Event listener for resetting the height of the user input field on blur.
         */
        function handleBlur() {
            chatInput.style.height = defaultHeight;
        }

        // Attach event listeners
        chatInput.addEventListener('keydown', handleKeyDown);
        chatInput.addEventListener("input", adjustHeight);
        chatInput.addEventListener("focus", adjustHeight);
        chatInput.addEventListener("blur", handleBlur);

        /**
         * Sets focus on the specified element only if it isn't currently focused.
         *
         * @param {HTMLElement} element - The element to focus.
         */
        function focusIfNotFocused(element) {
            if (document.activeElement !== element) {
                element.focus();
            }
        }

        focusIfNotFocused(chatInput);

        // Initial height adjustment
        adjustHeight();
    }

    // Call the function to initialize
    initializeChatInput();

    /**
     * Event listener for the logout button.
     * Calls the `logout` function when the button is clicked.
     */
    logoutButton.addEventListener('click', logout);
});
