import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.api import auth, conversations, threads
from app.core.templates import templates
from app.core.database import Base, engine
from app.exceptions.api_exception import APIException
from app.exceptions.groq_api_exception import GroqAPIException
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

# Include routers
app.include_router(auth.router) # Authentication routes
app.include_router(threads.router) # Thread-related routes
app.include_router(conversations.router) # Conversation routes

# Exception handlers

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handles HTTPExceptions and returns a template response.
    """
    return templates.TemplateResponse(
        "error.html",
        {
            "request": request,
            "status_code": exc.status_code,
            "detail": exc.detail
        },
        status_code=exc.status_code
    )

@app.exception_handler(GroqAPIException)
async def groq_api_exception_handler(request: Request, exc: GroqAPIException):
    """
    Handles GroqAPIErrors and returns a template response.
    """
    return templates.TemplateResponse(
        "error.html",
        {
            "request": request,
            "status_code": exc.status_code,
            "detail": exc.message,
        },
        status_code=exc.status_code
    )

@app.exception_handler(APIException)
async def api_error_handler(request: Request, exc: APIException):
    """
    Handles APIExceptions and returns a template response.
    """
    return templates.TemplateResponse(
        "error.html",
        {
            "request": request,
            "status_code": exc.status_code,
            "detail": exc.message
        },
        status_code=exc.status_code
    )

# Serve the favicon.ico file from the static directory
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(static_folder + "/favicon.ico")
