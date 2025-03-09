/**
 * Constructs the conversation tree by fetching and processing thread history.
 *
 * @function
 */
export function constructTree() {
    // Find the thread ID input element
    const threadIdElement = document.querySelector('input[name="thread_id"]');

    // Check if the thread ID element exists
    if (!threadIdElement) {
        console.warn("Thread ID input element not found. Tree construction skipped.");
        return;
    }

    // Parse the thread ID and query IDs
    const threadId = parseInt(threadIdElement.value, 10);
    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);

    // Fetch the conversation history after a short delay
    setTimeout(() => {
        fetch('/thread_conversation_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'thread_id': threadId })
        })
        .then(response => response.json())
        .then(conversation => {
            // Build the tree and select the appropriate node
            window.buildTreeAndSelectNode(conversation, queryIdsList);
        })
        .catch(error => console.error('Error loading thread conversation history:', error));
    }, 50);
}
