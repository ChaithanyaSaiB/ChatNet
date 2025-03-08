// function buildDynamicURL(threadId, queryIds, json) {
//     const baseURL = '/thread?thread_id=' + threadId;
//     let queryParams = '';

//     if (Array.isArray(queryIds)) {
//         // If queryIds is an array, handle multiple query IDs
//         queryParams = queryIds.map(id => 'query_id=' + id).join('&');
//     } else if (queryIds !== undefined && queryIds !== null) {
//         // If queryIds is a single value (and not undefined or null), handle single query ID
//         queryParams = 'query_id=' + queryIds;
//     }
//     else console.error('Invalid query ID(s) provided:', queryIds);

//     if (json) 
//         return baseURL + (queryParams ? '&' + queryParams : '') + '&json_response_format=true';
//     else
//     {
//         return baseURL + (queryParams ? '&' + queryParams : '');
//     }
// }

function selectedNodeChanged(queryId) {
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    fetch(window.buildDynamicURL(threadId, queryId, true), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw response;
        }
    })
    .then(data => {
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        
        // Update the URL to reflect the new state without reloading the page
        //history.pushState(null, '', `/thread?thread_id=${data.thread_id}&query_id=${data.query_id}`);
        history.pushState(null, '', window.buildDynamicURL(data.thread_id, data.query_id, false));
        window.renderMarkdown();
        window.scrollToQuery();
    })
    .catch(error => {
        errorDisplayForChatPane(error);
    });
}

function multipleSelectionChanged(queryId) {
    console.log('multipleSelectionChanged:', queryId);
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);
    
    const queryindex = queryIdsList.indexOf(queryId);
    if (queryindex !== -1) {
        queryIdsList.splice(queryindex, 1);
    } 
    else {
        queryIdsList.push(queryId);
    }

    // console.log("generated - ",window.buildDynamicURL(threadId, queryIdsList, true, justQueryIdsList));

    fetch(window.buildDynamicURL(threadId, queryIdsList, true), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw response;
        }        
    })
    .then(data => {
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        
        // Update the URL to reflect the new state without reloading the page
        history.pushState(null, '', window.buildDynamicURL(data.thread_id, data.query_id, false));
        
        window.selectCheckBoxesEventListener();
        window.expandAllButtonEventListener();
        window.collapseAllButtonEventListener();
        window.renderMarkdown();
        window.scrollToQuery();
    })
    .catch(error => {
        errorDisplayForChatPane(error);
    });
}
