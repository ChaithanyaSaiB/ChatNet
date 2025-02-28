from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.api import chat, user_access, thread_calls
import os
from contextlib import asynccontextmanager
from fastapi.templating import Jinja2Templates
from app.core.templates import templates
from app.core.database import Base, engine
from app.utils.api_error import APIError
from app.utils.langchain_utils import create_agent
from app.models.user import User
from app.models.thread import Thread
from app.models.search_result import SearchResult
from app.models.query import Query
from app.models.query_relation import QueryRelation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic (if any)

app = FastAPI(lifespan=lifespan)

# Get the absolute path to the current file's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Navigate up one level to reach the parent directory
project_root = os.path.dirname(current_dir)

# Construct the absolute path to the static folder
static_folder = os.path.join(project_root, "static")

# Mount the static files
app.mount("/static", StaticFiles(directory=static_folder), name="static")


app.include_router(chat.router)
app.include_router(user_access.router)
app.include_router(thread_calls.router)


@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return templates.TemplateResponse(
        "error.html",
        {"request": request, "status_code": exc.status_code, "detail": exc.detail},
        status_code=exc.status_code
    )
