from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.api import chat, user_access
import os
from fastapi.templating import Jinja2Templates
from app.core.database import Base, engine
from app.utils.api_error import APIError
from app.models.user import User
from app.models.thread import Thread
from app.models.search_result import SearchResult
from app.models.query import Query
from app.models.query_relation import QueryRelation
from app.models.ai_response import AIResponse

# Create the table(s) in the database (in production, use migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Get the absolute path to the current file's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Navigate up one level to reach the parent directory
project_root = os.path.dirname(current_dir)

# Construct the absolute path to the static folder
static_folder = os.path.join(project_root, "static")

# Mount the static files
app.mount("/static", StaticFiles(directory=static_folder), name="static")

# Construct the absolute path to the static folder
templates_folder = os.path.join(project_root, "templates")

# Mount the template files
templates = Jinja2Templates(directory=templates_folder)

app.include_router(chat.router)
app.include_router(user_access.router)

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message}
    )

@app.get("/continuechat/{thread_id}")
def continue_chat(request: Request, thread_id: str):
    #thread_chat = get_thread_chat_history(thread_id)
    return templates.TemplateResponse("index.html", {"request": request})#, "thread_chat": thread_chat})

@app.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/signup")
def login(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.get("/")
def newchat(request: Request):
    return templates.TemplateResponse("new_chat.html", {"request": request})