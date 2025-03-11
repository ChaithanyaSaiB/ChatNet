/**
 * @file This script manages sending queries, building conversation units, and handling responses in a chat interface.
 */

/**
 * Sends a query to the server and handles the response to build the conversation in the chat.
 *
 * This function differentiates between a normal reply and a merged reply based on the number of query IDs.
 */
function sendQuery() {
    const userInput = document.getElementById('user-input').value;

    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);

    if (userInput != "") {
        document.getElementById('user-input').value = '';
        
        if (queryIdsList.length == 1) {
            normalReplyBuilder(userInput, queryIdsList);
        }
        else {
            const justQueryIds = document.querySelector('input[name="just_query_ids"]').value;
            const justQueryIdsList = justQueryIds ? justQueryIds.split(',').map(Number) : [];
            mergedReplyBuilder(userInput, queryIdsList, justQueryIdsList);
        }
    }
    else {
        alert("oh no! I don't yet understand without you saying anything..");
    }
}

/**
 * Builds a conversation unit for a normal reply.
 *
 * @param {string} userInput - The text input by the user.
 * @param {number[]} queryIdsList - List of query IDs.
 * @param {number[]} [justQueryIds=null] - Optional list of just query IDs.
 * @param {object[]} [lastQueries=null] - Optional list of last queries in the conversation.
 */
function normalReplyBuilder(userInput, queryIdsList, justQueryIds = null, lastQueries=null) {
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);

    const newconversationUnit = document.createElement('div');
    newconversationUnit.className = 'conversation-unit';
    let htmlContent = `
        <div class="query-container">
            <div class="query">
                <p id="query-title">${userInput}</p>
            </div>
    `;
    if (lastQueries != null) {
        htmlContent += `
                <div class="parent_queries">
                    <h5 class="parent-queries-title">Parent Queries:</h5>
                    <ol class="parent-queries-list">
        `;

        lastQueries.forEach(query => {
            const parent_query_id = query.queryId;
            const parent_query_text = query.queryText;
            const truncatedText = parent_query_text.length > 95 ? parent_query_text.substring(0, 95) + "..." : parent_query_text;
            const history_included = !justQueryIds.includes(parent_query_id);

            htmlContent += `
                        <li>
                            <a href="/thread?thread_id=${threadId}&query_id=${parent_query_id}" class="parent-query-text">
                                ${truncatedText}
                                ${history_included ? '<i class="fas fa-history included-icon" title="With History"></i>' : '<i class="fas fa-ban excluded-icon" title="Without History"></i>'}
                            </a>
                        </li>
            `;
        });

        htmlContent += `
                    </ol>
                </div>
        `;
    }
    
    htmlContent += `
            </div>
    `;

    newconversationUnit.innerHTML = htmlContent;
    document.querySelector('#chat-area').appendChild(newconversationUnit);
    
    window.scrollToQuery();

    fetch(window.buildDynamicURL(threadId, queryIdsList, false, justQueryIds), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userInput })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw response;
        }
    })
    .then(data => {
        const lastConversationUnit = data.conversation_history[data.conversation_history.length - 1];
        document.querySelector('input[name="query_id"]').value = lastConversationUnit.query_id;
        const allConversationUnits = document.getElementsByClassName('conversation-unit');
        const lastConversationUnitElement = allConversationUnits[allConversationUnits.length - 1];
        
        lastConversationUnitElement.innerHTML += `
            <div class="response-container">
                <div class="response">
                    <div id="response-text" class="markdown-body">${marked.parse(lastConversationUnit.response)}</div>
                </div>
                ${lastConversationUnit.search_results && lastConversationUnit.search_results.length > 0 ? 
                    `
                    <div class="sources">
                    <h5 class="sources-title">Sources</h5>
                    ${lastConversationUnit.search_results.map(source => 
                        `<a href="${source}" class="source-item">${source}</a>`
                    ).join('')}
                    </div>`
                : ''}
            </div>
        `;

        history.pushState(null, '', `/thread?thread_id=${threadId}&query_id=${lastConversationUnit["query_id"]}`);
        if (lastConversationUnit.parent_query_ids.length > 1) {
            window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, true, lastConversationUnit.query, lastConversationUnit.response);
        }
        else {
            window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, false, lastConversationUnit.query, lastConversationUnit.response);
        }
        window.scrollToQuery();
        window.initializeChatInput();
    })
    .catch((error) => {
        window.errorDisplayForChatPane(error);
    });
}

/**
 * Builds a conversation unit for a merged reply.
 *
 * @param {string} userInput - The text input by the user.
 * @param {number[]} queryIdsList - List of query IDs.
 * @param {number[]} justQueryIds - List of just query IDs.
 */
function mergedReplyBuilder(userInput, queryIdsList, justQueryIds) {
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    
    const lastQueries = extractLastConversationIdAndQueryText();
    fetch(window.buildDynamicURL(threadId, queryIdsList[0], true), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw response;
        }
    })
    .then(data => {
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        
        history.pushState(null, '', window.buildDynamicURL(data.thread_id, data.query_id, false));
        window.renderMarkdown();
        window.scrollToQuery();
        normalReplyBuilder(userInput, queryIdsList, justQueryIds, lastQueries);
    })
    .catch(error => {
        window.errorDisplayForChatPane(error);
    });
}

/**
 * Extracts the last conversation ID and query text from each conversation group.
 *
 * @returns {object[]} An array of objects containing the last query ID and text from each conversation group.
 */
function extractLastConversationIdAndQueryText() {
    const conversationGroups = document.querySelectorAll('.conversation-group');
    const lastQueries = [];

    conversationGroups.forEach(group => {
        const lastConversationUnit = group.querySelector('.conversation-unit.last');

        if (lastConversationUnit) {
            const queryIdElement = lastConversationUnit.querySelector('.query_id');
            const queryId = queryIdElement ? parseInt(queryIdElement.dataset.value,10) : null;

            const queryTitleElement = lastConversationUnit.querySelector('#query-title');
            const queryText = queryTitleElement ? queryTitleElement.textContent : null;

            lastQueries.push({ queryId: queryId, queryText: queryText });
        }
    });

    return lastQueries;
}

/**
 * Truncates a string to a specified length, adding an ellipsis if it exceeds that length.
 *
 * @param {string} str - The string to truncate.
 * @param {number} n - The maximum length of the string.
 * @returns {string} The truncated string.
 */
function truncateString(str, n) {
    return (str.length > n) ? str.slice(0, n-1) + '&hellip;' : str;
}
