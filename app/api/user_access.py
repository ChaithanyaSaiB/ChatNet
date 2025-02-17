from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.models.pydantic_models import UserAccess
from app.services.user_management.user_manager import UserManager
from app.utils.dependency_injectors import get_user_manager

router = APIRouter()

@router.post("/user_login")
def logging_in_user(user: UserAccess, manager: UserManager = Depends(get_user_manager)):
    current_user = manager.authenticate_user(username=user.username, password=user.password)
    return JSONResponse(content={"message": "Login successful", "redirect": "/", "user_id": current_user.user_id, "username": current_user.username})

@router.post("/user_signup")
def signing_up_user(user: UserAccess, manager: UserManager = Depends(get_user_manager)):
    manager.create_user(username=user.username, password=user.password)
    return JSONResponse(content={"message": "User created successfully", "redirect": "/login"}, status_code=200)

