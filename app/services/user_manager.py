from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.authentication_manager import AuthenticationManager

class UserManager:
    """
    Handles user-related database operations.
    """

    def __init__(self, db: Session):
        self.db = db
        self.auth = AuthenticationManager(db)

    def create_user(self, username: str, password: str) -> User:
        """Create a new user with hashed password."""
        user = User(
            username=username,
            password=self.auth.get_password_hash(password)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Retrieve user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def update_user_password(self, user_id: int, new_password: str) -> User:
        """Update a user's password."""
        user = self.db.query(User).get(user_id)
        if not user:
            raise ValueError("User not found")
            
        user.password = self.auth.get_password_hash(new_password)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int) -> None:
        """Delete a user by ID."""
        user = self.db.query(User).get(user_id)
        if not user:
            raise ValueError("User not found")
            
        self.db.delete(user)
        self.db.commit()
