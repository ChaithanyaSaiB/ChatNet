function sendQuery() {
    const userInput = document.getElementById('user-input').value;
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    const queryId = document.querySelector('input[name="query_id"]').value;

    document.getElementById('user-input').value = '';

    const chatArea = document.getElementById('chat-area');
    chatArea.innerHTML += `
            <div class="query">
                <h2 id="query-title">${userInput}</h2>
            </div>
        `;

    fetch('/thread?thread_id='+threadId, {
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
        window.addNode(lastConversationUnit.parent_query_id, lastConversationUnit.query_id);
    })
    .catch((error) => console.error('Error:', error));
}