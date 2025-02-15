from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.threads_management.threads_manager import ConversationManager, ThreadsManager, UserManager

def get_conversation_manager(db: Session = Depends(get_db)) -> ConversationManager:
    return ConversationManager(db)

def get_threads_manager(db: Session = Depends(get_db)) -> ThreadsManager:
    return ThreadsManager(db)

def get_user_manager(db: Session = Depends(get_db)) -> UserManager:
    return UserManager(db)