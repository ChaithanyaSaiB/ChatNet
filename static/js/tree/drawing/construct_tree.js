export function constructTree() {
    const threadIdElement = document.querySelector('input[name="thread_id"]');

    if (!threadIdElement) {
        console.warn("Thread ID input element not found. Tree construction skipped.");
        return; // Exit the function early
    }
    
    const threadId = parseInt(threadIdElement.value, 10);
    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);
    
    setTimeout(() => {
        fetch('/thread_conversation_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({'thread_id': threadId})
        })
        .then(response => response.json())
        .then(conversation => {
            window.buildTreeAndSelectNode(conversation, queryIdsList);
        })
        .catch(error => console.error('Error loading thread conversation history:', error));
    }, 50);
}
