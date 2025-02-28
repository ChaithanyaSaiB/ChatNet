document.addEventListener('DOMContentLoaded', function() {
    // const queryDivs = document.querySelectorAll('.query'); //Select parent divs to loop

    // queryDivs.forEach(queryDiv => {
    //     const parentQueryId = queryDiv.querySelector('.parent_query_id').dataset.value;
    //     const queryId = queryDiv.querySelector('.query_id').dataset.value;

    //     console.log('Parent Query ID:', parentQueryId);
    //     console.log('Query ID:', queryId);

    //     window.addNode(parentQueryId, queryId); // Ensure addNode is globally accessible
    // });
    
    const threadId = parseInt(document.querySelector('input[name="thread_id"]').value, 10);
    const queryIdsString = document.querySelector('input[name="query_id"]').value;
    const queryIdsList = queryIdsString.split(', ').map(Number);
    
    console.log("construct tree working!");
    setTimeout(() => {
        fetch('/thread_conversation_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({'thread_id': threadId})
        })
        .then(response => response.json())
        .then(conversation => {
            window.buildTreeAndSelectNode(conversation, queryIdsList);
            setTimeout(drawTree, 100);
        })
        .catch(error => console.error('Error loading thread conversation history:', error));
    }, 50);
    //construct_tree()

});
