from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Query as fastapi_query, Cookie
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.models.pydantic_models import ThreadCreation, UserId, ContinueThread, ThreadId
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

@router.post("/thread_conversation_history")
def thread_conversations(
        request: Request,
        thread_id: ThreadId,
        conversation_manager: ConversationManager = Depends(get_conversation_manager)
    ):
    try:
        return conversation_manager.get_thread_conversation_history(thread_id=thread_id.thread_id)
    except Exception as e:
        raise e

@router.get("/thread")
def get_thread(
    request: Request,
    thread_id: int = fastapi_query(..., description="The ID of the thread"),
    query_id: Optional[List[int]] = fastapi_query(None, description="The ID of the query (optional)"),
    json_response_format: Optional[bool] = fastapi_query(None, description="True when response format is json (optional)"),
    conversation_manager: ConversationManager = Depends(get_conversation_manager)
):
    if query_id is None:
        query_id = conversation_manager.get_latest_query_id(thread_id=thread_id)
        conversation_history = conversation_manager.get_multiple_query_conversation_history(query_ids=[query_id], just_query_ids=[])
        
        return templates.TemplateResponse(
            "continued_thread.html",
            {
                "request": request,
                "thread_id": thread_id,
                "query_id": [query_id],
                "conversation_history": conversation_history
            }
        )
    else:
        conversation_history = conversation_manager.get_multiple_query_conversation_history(query_ids=query_id, just_query_ids=[])
        if json_response_format:
            html_content = templates.get_template("chat_pane.html").render(
                request=request,
                thread_id=thread_id,
                query_id=query_id,
                conversation_history=conversation_history
            )

            # Return JSON response
            return JSONResponse(content={
                "html": html_content,
                "thread_id": thread_id,
                "query_id": query_id
            })
        else:
            return templates.TemplateResponse(
                "continued_thread.html", 
                {
                    "request": request,
                    "thread_id": thread_id,
                    "query_id": query_id,
                    "conversation_history": conversation_history
                }
            )

@router.post("/thread")
async def post_thread(
    request: Request,
    continue_thread: ContinueThread,
    thread_id: int = fastapi_query(..., description="The ID of the thread"),
    query_id: Optional[List[int]] = fastapi_query(None, description="The ID of the query (optional)"),
    conversation_manager: ConversationManager = Depends(get_conversation_manager)
):
    #thread_continuation = await request.json()
    conversation_history = conversation_manager.get_multiple_query_conversation_history(
        query_ids=query_id, 
        just_query_ids=[]
    )
    updated_conversation_history = conversation_manager.create_query_with_response(
        thread_id=thread_id,
        user_id=continue_thread.user_id,
        query_content=continue_thread.query,
        conversation_history=conversation_history,
        parent_query_ids=query_id
    )
    return JSONResponse(content={
        "thread_id": thread_id,
        "query_id": updated_conversation_history[-1]["query_id"],
        "conversation_history": updated_conversation_history
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
    _ = conversation_manager.create_query_with_response(
        thread_id=new_thread_id,
        user_id=thread_creation.user_id,
        query_content=thread_creation.query
    )
    return RedirectResponse(url=f"/thread?thread_id={new_thread_id}", status_code=303)

@router.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/signup")
def signup(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.get("/")
def newchat(request: Request):
    return templates.TemplateResponse("new_thread.html", {"request": request})
