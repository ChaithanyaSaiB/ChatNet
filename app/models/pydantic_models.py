from pydantic import BaseModel
from typing import Annotated, Literal, Union
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
import operator

class State(TypedDict):
    """
    Conversation State Tracking:
    Tracks the accumulating list of messages in a conversation using LangChain's 
    BaseMessage format. The Annotated operator.add enables message aggregation.
    """
    messages: Annotated[list[BaseMessage], operator.add]

class UserCreate(BaseModel):
    """
    User Creation Model:
    Required fields for registering a new user in the system.
    """
    username: str  # Unique identifier for user authentication
    password: str  # Secret phrase for account access (should be hashed)

class QueryText(BaseModel):
    """
    User Input Model:
    Structure for receiving text queries from end-users.
    """
    query: str  # Natural language input from user/client

class UserId(BaseModel):
    """
    User Identifier:
    Standardized format for passing user references between system components.
    """
    user_id: int  # Database-generated unique user identifier

class TokenData(BaseModel):
    """
    Authentication Token Payload:
    Contains verifiable claims for JWT-based security tokens.
    """
    username: Union[str, None] = None  # Optional username for token verification
