from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
#from ..database import get_db
from app.models.pydantic_models import ThreadCreation, UserId
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
def chat(
        request: Request,
        thread_id: str = Query(..., description="The ID of the thread"),
        conversation_manager: ConversationManager = Depends(get_conversation_manager)
    ):
    latest_query = conversation_manager.get_latest_query(thread_id=thread_id)
    conversation_history = conversation_manager.get_conversation_history(query_id=latest_query.query_id)
    return templates.TemplateResponse(
        "continued_thread.html", 
        {
            "request": request,
            "conversation_history": conversation_history
        }
    )


@router.post("/new_thread")
def creating_thread(
        request: Request,
        thread_creation: ThreadCreation,
        thread_manager: ThreadManager = Depends(get_thread_manager),
        conversation_manager: ConversationManager = Depends(get_conversation_manager)
    ):
    new_thread_id = thread_manager.create_thread(user_id=thread_creation.user_id, title=thread_creation.query)
    query, response = conversation_manager.create_query_with_response(thread_id=new_thread_id, user_id=thread_creation.user_id, query_content=thread_creation.query)
    return templates.TemplateResponse(
        "continued_thread.html",
        {
            "request": request,
            "thread_id": new_thread_id,
            "new_query_id": query.query_id,
            "response_text": response.response_text # MIGHT HAVE TO REMOVE
        }
    )

@router.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/signup")
def login(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.get("/")
def newchat(request: Request):
    return templates.TemplateResponse("new_thread.html", {"request": request})
