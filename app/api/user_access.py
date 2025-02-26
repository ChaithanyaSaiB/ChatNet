from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models.pydantic_models import UserCreate
from app.services.user_manager import UserManager
from app.utils.dependency_injectors import get_user_manager
from app.utils.password_security import create_access_token

router = APIRouter()

@router.post("/token")
def logging_in_user(form_data: OAuth2PasswordRequestForm = Depends(), manager: UserManager = Depends(get_user_manager)):
    user = manager.authenticate_user(username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"username": user.username, "user_id": user.user_id})
    return JSONResponse(content={"access_token": access_token, "token_type": "bearer"}, status_code=status.HTTP_200_OK)
    
@router.post("/signup")
def signing_up_user(user: UserCreate, manager: UserManager = Depends(get_user_manager)):
    retrieved_user =  manager.get_user_by_username(username=user.username)
    if retrieved_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    new_user = manager.create_user(username=user.username, password=user.password)
    return JSONResponse(content={"user_id": new_user.user_id}, status_code=status.HTTP_201_CREATED)
