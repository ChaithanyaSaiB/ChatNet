/**
 * @file This script handles node selection changes in the conversation tree and updates the UI accordingly.
 */

/**
 * Handles single node selection changes in the conversation tree
 * @param {number} queryId - ID of the selected query node
 * @description
 * - Fetches updated conversation data for selected node
 * - Updates chat pane content and browser history state
 * - Triggers markdown rendering and scroll positioning
 */
function selectedNodeChanged(queryId) {
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    fetch(window.buildDynamicURL(threadId, queryId, true), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) return response.json();
        throw response;
    })
    .then(data => {
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        history.pushState(null, '', window.buildDynamicURL(data.thread_id, data.query_id, false));
        window.renderMarkdown();
        window.scrollToQuery();
    })
    .catch(error => errorDisplayForChatPane(error));
}

/**
 * Handles multiple node selection changes in the conversation tree
 * @param {number} queryId - ID of the toggled query node
 * @description
 * - Manages list of selected query IDs
 * - Fetches updated conversation data for multiple selections
 * - Updates UI components and browser history state
 * - Reinitializes selection controls and content rendering
 */
function multipleSelectionChanged(queryId) {
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);
    
    // Toggle query ID in selection list
    const queryIndex = queryIdsList.indexOf(queryId);
    queryIndex !== -1 ? queryIdsList.splice(queryIndex, 1) : queryIdsList.push(queryId);

    fetch(window.buildDynamicURL(threadId, queryIdsList, true), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) return response.json();
        throw response;
    })
    .then(data => {
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        history.pushState(null, '', window.buildDynamicURL(data.thread_id, data.query_id, false));
        
        // Reinitialize selection controls
        window.selectCheckBoxesEventListener();
        window.expandAllButtonEventListener();
        window.collapseAllButtonEventListener();
        window.renderMarkdown();
        window.scrollToQuery();
    })
    .catch(error => errorDisplayForChatPane(error));
}
