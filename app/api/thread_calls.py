from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Query as fastapi_query, Cookie
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.core.authorization import access_check, get_current_user
from app.models.pydantic_models import QueryText, UserId, ThreadId
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
    return thread_manager.list_threads(user_id=userId.user_id)

@router.post("/thread_conversation_history")
def thread_conversations(
        request: Request,
        thread_id_model: ThreadId,
        conversation_manager: ConversationManager = Depends(get_conversation_manager),
        user: User = Depends(access_check)
    ):
    try:
        return conversation_manager.get_thread_conversation_history(thread_id=thread_id_model.thread_id)
    except Exception as e:
        raise e

@router.get("/thread")
def get_thread(
    request: Request,
    thread_id: int = fastapi_query(..., description="The ID of the thread"),
    query_id: Optional[List[int]] = fastapi_query(None, description="The ID of the query (optional)"),
    json_response_format: Optional[bool] = fastapi_query(None, description="True when response format is json (optional)"),
    conversation_manager: ConversationManager = Depends(get_conversation_manager),
    user: User = Depends(access_check)
):
    if query_id is None:
        query_id = conversation_manager.get_latest_query_id(thread_id=thread_id)
        conversation_history = conversation_manager.get_query_conversation_history(query_id=query_id, just_query_id=False)
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
        aggregate_history = []
        for each_query_id in query_id:
            query_history = conversation_manager.get_query_conversation_history(
                query_id=each_query_id, 
                just_query_id=False
            )
            aggregate_history += query_history
        # conversation_history = conversation_manager.get_multiple_query_conversation_history(query_ids=query_id, just_query_ids=[])
        if json_response_format:
            query_id_copy = query_id.copy()
            print("conversation history",aggregate_history)
            for conversation_unit in aggregate_history:
                print(conversation_unit["query_id"])
                print(conversation_unit["query"])
                print(conversation_unit["parent_queries"])
                print("")
            html_content = templates.get_template("chat_pane.html").render(
                request=request,
                thread_id=thread_id,
                query_id=query_id,
                conversation_history=aggregate_history
            )
            
            # Return JSON response
            return JSONResponse(content={
                "html": html_content,
                "thread_id": thread_id,
                "query_id": query_id_copy
            })
        else:
            return templates.TemplateResponse(
                "continued_thread.html",
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
    user: User = Depends(access_check)
):
    aggregate_history = []

    if len(query_id) > 1:
        aggregate_history += [{"query": "Initial Merge Message"}]

    for each_query_id in query_id:
        if len(query_id) > 1:
            aggregate_history += [{"query": "Conversation Start"}]
        query_history = conversation_manager.get_query_conversation_history(
            query_id=each_query_id, 
            just_query_id=True if each_query_id in just_query_id else False
        )
        aggregate_history += query_history

    if len(query_id) > 1:
            aggregate_history += [{"query": "End Merge Message"}]

    # conversation_history = conversation_manager.get_query_conversation_history(
    #     query_ids=query_id,
    #     just_query_id=False
    # )
    print("query id is",query_id)
    print("justqueryids are", just_query_id)
    print(aggregate_history)
    updated_conversation_history = conversation_manager.create_query_with_response(
        thread_id=thread_id,
        user_id=user.user_id,
        query_content=query_text.query,
        conversation_history=aggregate_history,
        parent_query_ids=query_id,
        history_not_included = just_query_id
    )
    return JSONResponse(content={
        "thread_id": thread_id,
        "query_id": updated_conversation_history[-1]["query_id"],
        "conversation_history": updated_conversation_history
    })

@router.post("/new_thread")
def creating_thread(
        request: Request,
        query_text: QueryText,
        thread_manager: ThreadManager = Depends(get_thread_manager),
        conversation_manager: ConversationManager = Depends(get_conversation_manager),
        user: User = Depends(get_current_user)
    ):
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

@router.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/signup")
def signup(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.get("/")
def newchat(request: Request):
    return templates.TemplateResponse("new_thread.html", {"request": request})
