from fastapi import APIRouter, Depends, Request, Query as fastapi_query, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.models.pydantic_models import ThreadCreation, UserId, ContinueThread
from app.services.thread_manager import ThreadManager
from app.services.conversation_manager import ConversationManager
from app.utils.dependency_injectors import get_thread_manager, get_conversation_manager
from app.core.templates import templates

router = APIRouter()

@router.post("/list_threads")
def list_threads(
        request: Request,
        userId: UserId, 
        thread_manager: ThreadManager = Depends(get_thread_manager)
    ):
    return thread_manager.list_threads(user_id=userId.user_id)

@router.get("/thread")
def open_thread(
        request: Request,
        thread_id: int = fastapi_query(..., description="The ID of the thread"),
        conversation_manager: ConversationManager = Depends(get_conversation_manager)
    ):
    latest_query = conversation_manager.get_latest_query(thread_id=thread_id)
    conversation_history = conversation_manager.get_conversation_history(query_id=latest_query.query_id)
    return templates.TemplateResponse(
        "continued_thread.html", 
        {
            "request": request,
            "thread_id": thread_id,
            "query_id": latest_query.query_id,
            "conversation_history": conversation_history
        }
    )

@router.post("/continue_thread")
def continue_thread(
        request: Request,
        thread_continuation: ContinueThread,
        conversation_manager: ConversationManager = Depends(get_conversation_manager)
    ):
    conversation_history = conversation_manager.get_conversation_history(
        query_id=thread_continuation.query_id
    )
    query = conversation_manager.create_query_with_response(
        thread_id=thread_continuation.thread_id,
        user_id=thread_continuation.user_id,
        query_content=thread_continuation.query,
        conversation_history=conversation_history,
        parent_query_id=thread_continuation.query_id
    )
    conversation_history.append({"role": "user", "content": thread_continuation.query})
    conversation_history.append({"role": "ai", "content": query.ai_response})
    return JSONResponse(content={
        "thread_id": thread_continuation.thread_id,
        "query_id": query.query_id,
        "conversation_history": conversation_history
    })

@router.post("/new_thread")
def creating_thread(
        request: Request,
        thread_creation: ThreadCreation,
        thread_manager: ThreadManager = Depends(get_thread_manager),
        conversation_manager: ConversationManager = Depends(get_conversation_manager)
    ):
    new_thread_id = thread_manager.create_thread(
        user_id=thread_creation.user_id, 
        title=thread_creation.query
    )
    query = conversation_manager.create_query_with_response(
        thread_id=new_thread_id, 
        user_id=thread_creation.user_id, 
        query_content=thread_creation.query
    )
    return templates.TemplateResponse(
        "continued_thread.html",
        {
            "request": request,
            "thread_id": new_thread_id,
            "query_id": query.query_id,
            "conversation_history": [
                {"role": "user", "content": query.query_text}, 
                {"role": "ai", "content": query.ai_response}
            ],
        }
    )

@router.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/signup")
def signup(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.get("/")
def newchat(request: Request):
    return templates.TemplateResponse("new_thread.html", {"request": request})
