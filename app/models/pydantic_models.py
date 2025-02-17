from pydantic import BaseModel
from typing import Annotated, Literal, Union
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
import operator

class State(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]

class ChatRequest(BaseModel):
    message: str

# Pydantic models for request and response bodies
class ChatMessage(BaseModel):
    conversation_id: str
    role: str  # "user" or "assistant"
    message: str

class ChatResponse(BaseModel):
    response: str

class UserAccess(BaseModel):
    username: str
    password: str
