window.buildDynamicURL= function(threadId, queryIds, json, justQueryIds=null) {
    const baseURL = '/thread?thread_id=' + threadId;
    let queryParams = '';

    if (Array.isArray(queryIds)) {
        // If queryIds is an array, handle multiple query IDs
        queryParams = queryIds.map(id => 'query_id=' + id).join('&');
    } 
    else if (queryIds !== undefined && queryIds !== null) 
    {
        // If queryIds is a single value (and not undefined or null), handle single query ID
        queryParams = 'query_id=' + queryIds;
    }
    else console.error('Invalid query ID(s) provided:', queryIds);

    let justQueryParams = '';
    console.log("justqueyd condition result is",Array.isArray(justQueryIds));
    console.log("just qury ids value is", justQueryIds);

    if (Array.isArray(justQueryIds)) {
        // If queryIds is an array, handle multiple query IDs
        justQueryParams = justQueryIds.map(id => 'just_query_id=' + id).join('&');
    }
    else 
    {
        // If queryIds is a single value (and not undefined or null), handle single query ID
        justQueryParams = 'just_query_id=' + justQueryIds;
    }

    if (json) 
        if(justQueryIds)
        {
            console.log("pass 1");
            return baseURL + (queryParams ? '&' + queryParams : '') + (justQueryParams ? '&' + justQueryParams : '') + '&json_response_format=true';
        }
        else
        {
            return baseURL + (queryParams ? '&' + queryParams : '') + '&json_response_format=true';
        }
    else
    {
        return baseURL + (queryParams ? '&' + queryParams : '');
    }
}

// function sendQuery() {
//     const userInput = document.getElementById('user-input').value;
//     const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
//     const queryIdsString = document.querySelector('input[name="query_id"]').value;
//     const queryIdsList = queryIdsString.split(', ').map(Number);
//     if (userInput != "")
//     {
//         document.getElementById('user-input').value = '';

//         const newconversationUnit = document.createElement('div');
//         newconversationUnit.className = 'conversation-unit';
//         newconversationUnit.innerHTML += `
//                 <div class="query-container">
//                     <div class="query">
//                         <h2 id="query-title">${userInput}</h2>
//                     </div>
//                 </div>
//             `;
//             document.querySelector('#chat-area').appendChild(newconversationUnit);
        
//         window.scrollToQuery();
//         fetch(buildDynamicURL(threadId, queryIdsList, false), {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ query_text: { query: userInput } })
//         })
//         .then(response => {
//             if (response.status === 401) {
//                 throw new Error('Unauthorized: Please log in again.');
//             }
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log(data);
//             const lastConversationUnit = data.conversation_history[data.conversation_history.length - 1];
//             document.querySelector('input[name="query_id"]').value = lastConversationUnit.query_id;
//             const allConversationUnits = document.getElementsByClassName('conversation-unit');
//             const lastConversationUnitElement = allConversationUnits[allConversationUnits.length - 1];
//             lastConversationUnitElement.innerHTML += `
//                 <div class="response-container">
//                     <div class="response">
//                         <div id="response-text" class="markdown-body">${lastConversationUnit.response}</div>
//                     </div>
//                     <div class="sources">
//                         ${lastConversationUnit.search_results && lastConversationUnit.search_results.length > 0 ? 
//                             `<h5 class="sources-title">Sources</h5>
//                             ${lastConversationUnit.search_results.map(source => 
//                                 `<a href="${source}" class="source-item">${source}</a>`
//                             ).join('')}`
//                         : ''}
//                     </div>
//                 </div>
//             `;

//             renderMarkdown();
//             console.log("latest_quest_id",lastConversationUnit.query_id);
//             history.pushState(null, '', `/thread?thread_id=${threadId}&query_id=${lastConversationUnit["query_id"]}`);
//             console.log(lastConversationUnit.parent_query_ids);
//             if (lastConversationUnit.parent_query_ids.length > 1) 
//             {
//                 window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, true, truncateString(lastConversationUnit.query), truncateString(lastConversationUnit.response));
//             }
//             else
//             {
//                 window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, false, truncateString(lastConversationUnit.query), truncateString(lastConversationUnit.response));
//             }
//             window.scrollToQuery();
//         })
//         .catch((error) => {
//             console.error('Error:', error);

//             // Display error message to user
//             let chatPane = document.querySelector('.chat-pane');
//             chatPane.innerHTML = `
//                 <div class="error-message">
//                     <h2>An error occurred</h2>
//                     <p>${error.message}</p>
//                     <button onclick="location.reload()">Try Again</button>
//                 </div>
//             `;
            
//             // If it's an authentication error, you might want to redirect to login page
//             if (error.message.includes('Unauthorized')) {
//                 setTimeout(() => {
//                     window.location.href = '/login'; // Adjust this URL as needed
//                 }, 3000); // Redirect after 3 seconds
//             }
//         });
//     }
//     else
//     {
//         alert("oh no! I don't yet understand without you saying anything..");
//     }
// }

function sendQuery() {
    const userInput = document.getElementById('user-input').value;

    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);

    if (userInput != "")
    {
        document.getElementById('user-input').value = '';
        
        if (queryIdsList.length == 1)
        {
            normalReplyBuilder(userInput, queryIdsList);
        }
        else
        {
            const justQueryIds = document.querySelector('input[name="just_query_ids"]').value;
            const justQueryIdsList = justQueryIds ? justQueryIds.split(',').map(Number) : [];
            
            mergedReplyBuilder(userInput, queryIdsList, justQueryIdsList);
        }
    }
    else
    {
        alert("oh no! I don't yet understand without you saying anything..");
    }
}

function normalReplyBuilder(userInput, queryIdsList, justQueryIds = null, lastQueries=null)
{
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);

    const newconversationUnit = document.createElement('div');
    newconversationUnit.className = 'conversation-unit';
    let htmlContent = `
        <div class="query-container">
            <div class="query">
                <h2 id="query-title">${userInput}</h2>
            </div>
    `;
    if (lastQueries != null)
    {
        htmlContent += `
                <div class="parent_queries">
                    <h5 class="parent-queries-title">Parent Queries:</h5>
                    <ol class="parent-queries-list">
        `;

        lastQueries.forEach(query => {
            const parent_query_id = query.queryId;
            const parent_query_text = query.queryText;

            const truncatedText = parent_query_text.length > 95 ? parent_query_text.substring(0, 95) + "..." : parent_query_text;
            const history_included = !justQueryIds.includes(parent_query_id.toString());
            
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
    console.log("justqueryids before fetch",justQueryIds);
    console.log("url generated in normal reply builder is",window.buildDynamicURL(threadId, queryIdsList, false, justQueryIds));
    fetch(window.buildDynamicURL(threadId, queryIdsList, false, justQueryIds), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_text: { query: userInput } })
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Unauthorized: Please log in again.');
        }
        // if (!response.ok) {
        //     throw new Error('Network response was not ok');            
        // }
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
            window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, true, lastConversationUnit.query, lastConversationUnit.response);
        }
        else
        {
            window.addNode(lastConversationUnit.parent_query_ids[0], lastConversationUnit.query_id, false, lastConversationUnit.query, lastConversationUnit.response);
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

function mergedReplyBuilder(userInput, queryIdsList, justQueryIds)
{
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    // const queryIdsString = document.querySelector('input[name="query_id"]').value;
    // const queryIdsList = queryIdsString.split(', ').map(Number);
    
    const lastQueries = extractLastConversationIdAndQueryText();
    console.log("just query ids inside merged reply ",justQueryIds);
    fetch(window.buildDynamicURL(threadId, queryIdsList[0], true), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        
        // Update the URL to reflect the new state without reloading the page
        //history.pushState(null, '', `/thread?thread_id=${data.thread_id}&query_id=${data.query_id}`);
        history.pushState(null, '', window.buildDynamicURL(data.thread_id, data.query_id, false));
        window.renderMarkdown();
        window.scrollToQuery();
        console.log("just query ids inside fetch",justQueryIds);
        normalReplyBuilder(userInput, queryIdsList, justQueryIds, lastQueries);
    })
    .catch(error => {
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
            window.location.href = '/login'; // Adjust this URL as needed
        }
    });
}

function extractLastConversationIdAndQueryText()
{
    // 1. Select all conversation groups:
    const conversationGroups = document.querySelectorAll('.conversation-group');

    const lastQueries = [];

    // 2. Iterate over each conversation group:
    conversationGroups.forEach(group => {
        // 3. Find the last conversation unit within the group:
        const lastConversationUnit = group.querySelector('.conversation-unit.last');

        // 4. If there is a last conversation unit (handling potential errors):
        if (lastConversationUnit) {
            // 5. Extract the query_id:
            const queryIdElement = lastConversationUnit.querySelector('.query_id');
            const queryId = queryIdElement ? queryIdElement.dataset.value : null;

            // 6. Extract the query text:
            const queryTitleElement = lastConversationUnit.querySelector('#query-title');
            const queryText = queryTitleElement ? queryTitleElement.textContent : null;

            // 7. Add the extracted data to the array:
            lastQueries.push({ queryId: queryId, queryText: queryText });
        }
    });
    console.log("last queries is",lastQueries);
    return lastQueries
}