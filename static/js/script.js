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
      
        const remainingSpace = chatAreaHeight - targetRect.height;
        if (remainingSpace > 0) {
          const extraSpace = document.createElement('div');
          extraSpace.style.height = `${remainingSpace}px`;
          chatArea.appendChild(extraSpace);
        }
      
        chatArea.scrollTop = newScrollTop;
    }

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

    // --- Chat Input Elements ---
    const chatInput = document.getElementById('user-input');
    const sendButton = document.querySelector('#send-button');

    /**
     * Event listener for the chat input to send a message on pressing Enter.
     *
     * @param {Event} event - The keypress event.
     */
    chatInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendButton.click();
        }
    });

    /**
     * Event listener for the logout button.
     * Calls the `logout` function when the button is clicked.
     */
    logoutButton.addEventListener('click', logout);

    // --- User Input Adjustment ---
    const userInput = document.querySelector("#user-input");
    const defaultHeight = "40px";
    const maxHeight = "120px";

    /**
     * Adjusts the height of the user input field based on its content.
     */
    function adjustHeight() {
        userInput.style.height = defaultHeight;
        userInput.style.height = Math.min(userInput.scrollHeight, parseInt(maxHeight)) + "px";
    }

    /**
     * Event listener for adjusting the height of the user input field.
     */
    userInput.addEventListener("input", adjustHeight);

    /**
     * Event listener for adjusting the height of the user input field on focus.
     */
    userInput.addEventListener("focus", adjustHeight);

    /**
     * Event listener for resetting the height of the user input field on blur.
     */
    userInput.addEventListener("blur", function () {
        userInput.style.height = defaultHeight;
    });
});
