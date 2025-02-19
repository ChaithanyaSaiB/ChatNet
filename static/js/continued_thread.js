function sendQuery() {
    const userInput = document.getElementById('user-input').value;
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    const queryId = document.querySelector('input[name="query_id"]').value;

    fetch('/continue_thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            thread_id: threadId,
            query_id: queryId,
            query: userInput,
            user_id: getCookie('user_id')
        }),
    })
    .then(response => response.json())
    .then(data => {
        const chatArea = document.getElementById('chat-area');
        const lastUserQuery = data.conversation_history[data.conversation_history.length - 2];
        const lastAiResponse = data.conversation_history[data.conversation_history.length - 1];
        chatArea.innerHTML += `
            <div class="query">
                <h2 id="query-title">${lastUserQuery.content}</h2>
            </div>
            <div class="response">
                <h3 class="response-title">Answer</h3>
                <p id="response-text">${lastAiResponse.content}</p>
            </div>
        `;
        document.getElementById('user-input').value = '';
    })
    .catch((error) => console.error('Error:', error));    
}