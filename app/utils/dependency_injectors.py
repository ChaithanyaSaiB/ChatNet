from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.thread_manager import ThreadManager
from app.services.user_manager import UserManager
from app.services.conversation_manager import ConversationManager
from app.services.authentication_manager import AuthenticationManager

def get_conversation_manager(db: Session = Depends(get_db)) -> ConversationManager:
    """Conversation manager dependency."""
    return ConversationManager(db)

def get_thread_manager(db: Session = Depends(get_db)) -> ThreadManager:
    """Thread manager dependency."""
    return ThreadManager(db)

def get_user_manager(db: Session = Depends(get_db)) -> UserManager:
    """User manager dependency."""
    return UserManager(db)

def get_authentication_manager(db: Session = Depends(get_db)) -> AuthenticationManager:
    """Authentication manager dependency."""
    return AuthenticationManager(db)