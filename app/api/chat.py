from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
#from ..database import get_db
from app.models.pydantic_models import ChatRequest
from app.services.response_generation import get_response
from app.core.database import get_db

router = APIRouter()

@router.post("/response")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    response = get_response(request.message, db)
    return {"response": response}

@router.post("/threadlist")
def chat(db: Session = Depends(get_db)):
    thread_list = 0;#get_thread_list(db)
    return {"thread list": thread_list}

