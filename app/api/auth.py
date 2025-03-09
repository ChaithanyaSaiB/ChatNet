from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.templates import templates
from app.models.user import User
from app.models.pydantic_models import UserCreate
from app.services.user_manager import UserManager
from app.utils.dependency_injectors import get_user_manager
from app.utils.password_security import create_access_token
from app.core.authorization import get_current_user
from datetime import timedelta
import os

router = APIRouter()

@router.get("/login")
def login(request: Request):
    """
    Render a page for letting user login to their account.
    
    Parameters:
      - request: The HTTP request object.
    
    Returns:
      - A template response for the login page.
    """
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/token")
def logging_in_user(
        response: Response,
        form_data: OAuth2PasswordRequestForm = Depends(), 
        manager: UserManager = Depends(get_user_manager)
    ):
    """
    Authenticate the user and generate an access token.
    Sets a session cookie for the authenticated user.
    """
    user = manager.authenticate_user(username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expire_minutes = int(os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'])
    access_token_expires = timedelta(minutes=access_token_expire_minutes)
    access_token = create_access_token(
        data={"username": user.username}, expires_delta=access_token_expires
    )
    content = {"message": "Login successful"}
    response = JSONResponse(content=content, status_code=status.HTTP_200_OK)
    response.set_cookie(
        key="session", 
        value=access_token, 
        httponly=True, 
        max_age=access_token_expire_minutes * 60,
        expires=access_token_expire_minutes * 60,
        samesite="lax",
        # secure=True  # Uncomment for HTTPS environments
    )
    return response

@router.get("/signup")
def signup(request: Request):
    """
    Render signup page for letting user signup.
    
    Parameters:
      - request: The HTTP request object.
    
    Returns:
      - A template response for the signup page.
    """
    return templates.TemplateResponse("signup.html", {"request": request})

@router.post("/signup")
def signing_up_user(
        user: UserCreate,
        manager: UserManager = Depends(get_user_manager)
    ):
    """
    Create a new user account.
    Returns an error if the username already exists.
    """
    retrieved_user = manager.get_user_by_username(username=user.username)
    if retrieved_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    new_user = manager.create_user(username=user.username, password=user.password)
    return JSONResponse(content={"user_id": new_user.user_id}, status_code=status.HTTP_201_CREATED)


@router.get("/me")
def get_current_user(request: Request, user: User = Depends(get_current_user)):
    """
    Retrieve information about the currently authenticated user.
    """
    return {
        "user_id": user.user_id,
        "username": user.username,
        "created_at": user.created_at.isoformat()
    }

@router.post("/logout")
def logout(response: Response):
    """
    Log out the current user by clearing the session cookie.
    """
    response.delete_cookie(key="session")
    return {"message": "Logged out successfully"}
