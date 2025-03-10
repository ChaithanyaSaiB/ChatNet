from fastapi import Depends, HTTPException, Request, status
from app.models.user import User
from app.services.user_manager import UserManager
from app.services.authentication_manager import AuthenticationManager
from app.utils.dependency_injectors import get_authentication_manager

async def get_current_user(
    request: Request,
    auth: AuthenticationManager = Depends(get_authentication_manager)
):
    """FastAPI dependency to get authenticated user."""
    return auth.get_current_user(request)

async def verify_thread_access(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    auth: AuthenticationManager = Depends(get_authentication_manager)
):
    """FastAPI dependency to verify thread access."""
    if not auth.check_thread_access(current_user.user_id, thread_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to thread denied"
        )
    return current_user
