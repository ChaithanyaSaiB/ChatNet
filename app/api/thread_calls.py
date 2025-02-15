from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
#from ..database import get_db
from app.models.pydantic_models import ChatRequest
from app.services.threads_management.threads_manager import ThreadsManager
from app.utils.dependency_injectors import get_threads_manager

router = APIRouter()

@router.get("/list_threads")
def list_threads(user_id: int, manager: ThreadsManager = Depends(get_threads_manager)):
    return manager.list_threads(user_id=user_id)

@router.get("/thread/{thread_id}")
def chat(thread_id: int, manager: ThreadsManager = Depends(get_threads_manager)):
    return manager.get_thread_by_id(thread_id=thread_id)

