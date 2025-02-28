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
    document.getElementById('user-input').value = '';

    const chatArea = document.getElementById('chat-area');
    chatArea.innerHTML += `
            <div class="query">
                <h2 id="query-title">${userInput}</h2>
            </div>
        `;

    fetch(buildDynamicURL(threadId, queryIdsList, false), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_text: { query: userInput } })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const chatArea = document.getElementById('chat-area');
        const lastConversationUnit = data.conversation_history[data.conversation_history.length - 1];
        document.querySelector('input[name="query_id"]').value = lastConversationUnit.query_id;
        chatArea.innerHTML += `
            <div class="response">
                <h3 class="response-title">Answer</h3>
                <p id="response-text">${lastConversationUnit["response"]}</p>
            </div>
        `;
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
    })
    .catch((error) => console.error('Error:', error));
}