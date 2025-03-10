from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from typing import Optional, Union
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.thread import Thread

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthenticationManager:
    """
    Handles password security, JWT token operations, and user authentication.
    """

    def __init__(self, db: Session):
        self.db = db

    # Password utilities
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate a bcrypt hash for a password."""
        return pwd_context.hash(password)

    # Token utilities
    @staticmethod
    def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
            expires_delta or 
            timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15)))
        )
        to_encode.update({"exp": expire})
        return jwt.encode(
            to_encode,
            os.getenv("SECRET_KEY"),
            algorithm=os.getenv("ALGORITHM", "HS256")
        )

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode a JWT token without validation."""
        try:
            return jwt.decode(
                token,
                os.getenv("SECRET_KEY"),
                algorithms=[os.getenv("ALGORITHM", "HS256")]
            )
        except JWTError:
            return None

    # Authentication operations
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user with username/password."""
        user = self.db.query(User).filter(User.username == username).first()
        if not user or not self.verify_password(password, user.password):
            return None
        return user

    def get_current_user(self, request: Request) -> User:
        """Retrieve authenticated user from request cookie."""
        token = request.cookies.get("session")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has ended. Please login again to continue"
            )

        payload = self.decode_token(token)
        if not payload or "username" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        user = self.db.query(User).filter(
            User.username == payload["username"]
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        return user

    # Authorization check
    def check_thread_access(self, user_id: int, thread_id: int) -> bool:
        """Verify user access to a specific thread."""
        return self.db.query(Thread).filter(
            Thread.thread_id == thread_id,
            Thread.user_id == user_id
        ).first() is not None
