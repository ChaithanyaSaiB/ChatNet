from app.models.pydantic_models import ThreadId, TokenData
from app.services.user_manager import UserManager, oauth2_scheme
from fastapi import Depends, HTTPException, status, Query, Request
from jose import JWTError, jwt
from app.models.user import User
import os
from app.utils.dependency_injectors import get_user_manager

def get_current_user(request: Request, user_manager: UserManager = Depends(get_user_manager)):
    token = request.cookies.get("session")
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.environ["SECRET_KEY"], algorithms=[os.environ["ALGORITHM"]])#, options={"verify_exp": False})
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        print(f"Error decoding JWT: {str(e)}")  # Log the error details for debugging
        raise JWTError(f"JWT decoding failed: {str(e)}")
    user = user_manager.get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def access_check(
        thread_id: int = None,
        thread_id_model: ThreadId = None,
        user_manager: UserManager = Depends(get_user_manager), 
        user: User = Depends(get_current_user)
    ):
    thread_id = thread_id if thread_id is not None else thread_id_model.thread_id
    approved_access = user_manager.checking_user_thread_access(
        user_id=user.user_id, 
        thread_id=thread_id
    )
    if not approved_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this thread"
        )
    return user  # Return the user object after checking access

