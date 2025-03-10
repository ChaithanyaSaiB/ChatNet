from typing import List, Optional

from fastapi import APIRouter, Depends, Request, Query as fastapi_query, HTTPException
from fastapi.responses import JSONResponse

from app.core.authorization import verify_thread_access
from app.models.pydantic_models import QueryText
from app.models.user import User
from app.services.conversation_manager import ConversationManager
from app.utils.dependency_injectors import get_conversation_manager
from app.core.templates import templates

router = APIRouter()

@router.post("/thread_conversation_history")
def thread_conversations(
    request: Request,
    thread_id: int = fastapi_query(..., description="The ID of the thread"),
    conversation_manager: ConversationManager = Depends(get_conversation_manager),
    user: User = Depends(verify_thread_access)
):
    """
    Retrieve the full conversation history for a given thread ID.

    Parameters:
      - thread_id_model (ThreadId): The thread ID model containing the thread ID.
      - conversation_manager (ConversationManager): Dependency to manage conversations.
      - user (User): The authenticated user making the request.

    Returns:
      - A list of all conversations within the specified thread.
    """
    try:
        return conversation_manager.get_thread_conversation_history(thread_id=thread_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thread")
def get_thread(
    request: Request,
    thread_id: int = fastapi_query(..., description="The ID of the thread"),
    query_id: Optional[List[int]] = fastapi_query(None, description="The ID of the query (optional)"),
    json_response_format: Optional[bool] = fastapi_query(None, description="True when response format is JSON (optional)"),
    conversation_manager: ConversationManager = Depends(get_conversation_manager),
    user: User = Depends(verify_thread_access)
):
    """
    Retrieve a thread's conversation history or specific queries.

    Parameters:
      - thread_id (int): The ID of the thread.
      - query_id (Optional[List[int]]): Specific query IDs to retrieve (optional).
      - json_response_format (Optional[bool]): Whether to return the response as JSON (optional).
      - conversation_manager (ConversationManager): Dependency to manage conversations.
      - user (User): The authenticated user making the request.

    Returns:
      - A rendered template or JSON response containing the conversation history.
    """
    if query_id is None:
        # If no query ID is provided, get the latest query in the thread
        query_id = conversation_manager.get_latest_query_id(thread_id=thread_id)
        conversation_history = conversation_manager.get_query_conversation_history(query_id=query_id, just_query_id=False)
        return templates.TemplateResponse(
            "continued-thread.html",
            {
                "request": request,
                "thread_id": thread_id,
                "query_id": [query_id],
                "conversation_history": conversation_history
            }
        )
    else:
        # Aggregate history for multiple query IDs
        aggregate_history = []
        for each_query_id in query_id:
            query_history = conversation_manager.get_query_conversation_history(
                query_id=each_query_id,
                just_query_id=False
            )
            aggregate_history += query_history

        if json_response_format:
            # Return JSON response with rendered HTML content
            html_content = templates.get_template("chat-pane.html").render(
                request=request,
                thread_id=thread_id,
                query_id=query_id,
                conversation_history=aggregate_history
            )
            return JSONResponse(content={
                "html": html_content,
                "thread_id": thread_id,
                "query_id": query_id
            })
        else:
            # Render template with aggregated history
            return templates.TemplateResponse(
                "continued-thread.html",
                {
                    "request": request,
                    "thread_id": thread_id,
                    "query_id": query_id,
                    "conversation_history": aggregate_history
                }
            )


@router.post("/thread")
async def post_thread(
    request: Request,
    query_text: QueryText,
    thread_id: int = fastapi_query(..., description="The ID of the thread"),
    query_id: Optional[List[int]] = fastapi_query(None, description="The ID of the query (optional)"),
    just_query_id: Optional[List[int]] = fastapi_query([], description="The IDs of queries that need to be skipped for history (optional)"),
    conversation_manager: ConversationManager = Depends(get_conversation_manager),
    user: User = Depends(verify_thread_access)
):
    """
    Add a new message to a thread and update its conversation history.

    Parameters:
      - query_text (QueryText): The content of the new message.
      - thread_id (int): The ID of the thread to which the message belongs.
      - query_id (Optional[List[int]]): Parent queries to associate with this message.
      - just_query_id (Optional[List[int]]): Queries to exclude from history aggregation.
      - conversation_manager (ConversationManager): Dependency to manage conversations.
      - user (User): The authenticated user making the request.

    Returns:
      - A JSON response containing the updated conversation history and new message details.
    """
    aggregate_history = []

    if len(query_id) > 1:
        # Add an initial merge message if there are multiple parent queries
        aggregate_history += [{"query": "Initial Merge Message"}]

    for each_query_id in query_id:
        if len(query_id) > 1:
            aggregate_history += [{"query": "Conversation Start"}]
        # Fetch query history based on whether it should be included or skipped
        query_history = conversation_manager.get_query_conversation_history(
            query_id=each_query_id,
            just_query_id=True if each_query_id in just_query_id else False
        )
        aggregate_history += query_history

    if len(query_id) > 1:
        # Add an end merge message if there are multiple parent queries
        aggregate_history += [{"query": "End Merge Message"}]

    # Create a new message with aggregated history
    updated_conversation_history = conversation_manager.create_query_with_response(
        thread_id=thread_id,
        user_id=user.user_id,
        query_content=query_text.query,
        conversation_history=aggregate_history,
        parent_query_ids=query_id,
        history_not_included=just_query_id
    )

    return JSONResponse(content={
        "thread_id": thread_id,
        "query_id": updated_conversation_history[-1]["query_id"],
        "conversation_history": updated_conversation_history
    })
