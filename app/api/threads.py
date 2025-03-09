from fastapi import APIRouter, Depends, Request, Query as fastapi_query
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.authorization import access_check, get_current_user
from app.models.pydantic_models import QueryText, UserId
from app.models.user import User
from app.services.thread_manager import ThreadManager
from app.services.conversation_manager import ConversationManager
from app.utils.dependency_injectors import get_thread_manager, get_conversation_manager
from app.core.templates import templates

router = APIRouter()

@router.post("/list_threads")
def list_threads(
        request: Request,
        userId: UserId, 
        thread_manager: ThreadManager = Depends(get_thread_manager),
        user: User = Depends(get_current_user)
    ):
    """
    List all threads created by the specified user.
    
    Parameters:
      - userId: The ID of the user whose threads are to be listed.
    
    Returns:
      - A list of threads associated with the given user ID.
    """
    return thread_manager.list_threads(user_id=userId.user_id)

@router.post("/new_thread")
def creating_thread(
        request: Request,
        query_text: QueryText,
        thread_manager: ThreadManager = Depends(get_thread_manager),
        conversation_manager: ConversationManager = Depends(get_conversation_manager),
        user: User = Depends(get_current_user)
    ):
    """
    Create a new thread and initialize it with a query.
    
    Parameters:
      - query_text: The initial query text for the thread.
    
    Returns:
      - Redirects to the newly created thread's page.
    """
    new_thread_id = thread_manager.create_thread(
        user_id=user.user_id,
        title=query_text.query
    )
    _ = conversation_manager.create_query_with_response(
        thread_id=new_thread_id,
        user_id=user.user_id,
        query_content=query_text.query
    )
    return RedirectResponse(url=f"/thread?thread_id={new_thread_id}", status_code=303)

@router.get("/")
def newchat(request: Request, user: User = Depends(get_current_user)):
    """
    Render a page for starting a new chat thread.
    
    Parameters:
      - request: The HTTP request object.
    
    Returns:
      - A template response for the new chat page.
    """
    return templates.TemplateResponse("new-thread.html", {"request": request})
