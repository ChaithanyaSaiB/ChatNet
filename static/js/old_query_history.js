function selectedNodeChanged(queryId) {
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    
    fetch('/thread?thread_id='+threadId+'&query_id='+queryId+'&json_response_format=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        let chatPane = document.querySelector('.chat-pane');
        chatPane.innerHTML = data.html;
        
        // Update the URL to reflect the new state without reloading the page
        history.pushState(null, '', `/thread?thread_id=${data.thread_id}&query_id=${data.query_id}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}