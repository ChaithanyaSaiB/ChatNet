from pydantic import BaseModel
from typing import Annotated, Literal, Union
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
import operator

class State(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]

class ChatRequest(BaseModel):
    message: str

class ChatMessage(BaseModel):
    conversation_id: int  # Changed from str to int
    role: str  # "user" or "assistant"
    message: str

class ChatResponse(BaseModel):
    response: str

class UserCreate(BaseModel):
    username: str
    password: str

class ThreadCreation(BaseModel):
    user_id: int  # Changed from str to int
    query: str

class UserId(BaseModel):
    user_id: int

class ThreadId(BaseModel):
    thread_id: int

class ContinueThread(BaseModel):
    query: str
    user_id: int

class TokenData(BaseModel):
    username: Union[str, None] = None
