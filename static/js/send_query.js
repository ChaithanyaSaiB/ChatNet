function buildDynamicURL(threadId, queryIds, json) {
    const baseURL = '/thread?thread_id=' + threadId;
    let queryParams = '';

    if (Array.isArray(queryIds)) {
        // If queryIds is an array, handle multiple query IDs
        queryParams = queryIds.map(id => 'query_id=' + id).join('&');
    } else if (queryIds !== undefined && queryIds !== null) {
        // If queryIds is a single value (and not undefined or null), handle single query ID
        queryParams = 'query_id=' + queryIds;
    }
    else console.error('Invalid query ID(s) provided:', queryIds);

    if (json) 
        return baseURL + (queryParams ? '&' + queryParams : '') + '&json_response_format=true';
    else
    {
        return baseURL + (queryParams ? '&' + queryParams : '');
    }
}

function sendQuery() {
    const userInput = document.getElementById('user-input').value;
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);
    if (userInput != "")
    {
        document.getElementById('user-input').value = '';

        const newconversationUnit = document.createElement('div');
        newconversationUnit.className = 'conversation-unit';
        newconversationUnit.innerHTML += `
                <div class="query-container">
                    <div class="query">
                        <h2 id="query-title">${userInput}</h2>
                    </div>
                </div>
            `;
            document.querySelector('#chat-area').appendChild(newconversationUnit);
        
        window.scrollToQuery();
        fetch(buildDynamicURL(threadId, queryIdsList, false), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query_text: { query: userInput } })
        })
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized: Please log in again.');
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            const lastConversationUnit = data.conversation_history[data.conversation_history.length - 1];
            document.querySelector('input[name="query_id"]').value = lastConversationUnit.query_id;
            const allConversationUnits = document.getElementsByClassName('conversation-unit');
            const lastConversationUnitElement = allConversationUnits[allConversationUnits.length - 1];
            lastConversationUnitElement.innerHTML += `
                <div class="response-container">
                    <div class="response">
                        <div id="response-text" class="markdown-body">${lastConversationUnit.response}</div>
                    </div>
                    <div class="sources">
                        ${lastConversationUnit.search_results && lastConversationUnit.search_results.length > 0 ? 
                            `<h5 class="sources-title">Sources</h5>
                            ${lastConversationUnit.search_results.map(source => 
                                `<a href="${source}" class="source-item">${source}</a>`
                            ).join('')}`
                        : ''}
                    </div>
                </div>
            `;

            renderMarkdown();
            console.log("latest_quest_id",lastConversationUnit.query_id);
            history.pushState(null, '', `/thread?thread_id=${threadId}&query_id=${lastConversationUnit["query_id"]}`);
            console.log(lastConversationUnit.parent_query_ids);
            if (lastConversationUnit.parent_query_ids.length > 1) 
            {
                window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, true, truncateString(lastConversationUnit.query), truncateString(lastConversationUnit.response));
            }
            else
            {
                window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, false, truncateString(lastConversationUnit.query), truncateString(lastConversationUnit.response));
            }
            window.scrollToQuery();
        })
        .catch((error) => {
            console.error('Error:', error);

            // Display error message to user
            let chatPane = document.querySelector('.chat-pane');
            chatPane.innerHTML = `
                <div class="error-message">
                    <h2>An error occurred</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Try Again</button>
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
        alert("oh no! I don't yet understand without you saying anything..");
    }
}