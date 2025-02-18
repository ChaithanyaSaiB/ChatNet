from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.thread_manager import ThreadManager
from app.services.user_manager import UserManager
from app.services.conversation_manager import ConversationManager


def get_conversation_manager(db: Session = Depends(get_db)) -> ConversationManager:
    return ConversationManager(db)

def get_thread_manager(db: Session = Depends(get_db)) -> ThreadManager:
    return ThreadManager(db)

def get_user_manager(db: Session = Depends(get_db)) -> UserManager:
    return UserManager(db)