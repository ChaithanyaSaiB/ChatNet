from typing import Optional
from sqlalchemy.orm import Session
from app.services.base_service import BaseService
from app.models.user import User
from app.models.thread import Thread
from app.utils.password_security import verify_password, get_password_hash

class UserManager(BaseService):
    """
    Manages user-related operations, including user creation, authentication,
    and access control.
    """

    def __init__(self, db: Session):
        """
        Initializes the UserManager with a database session.

        Args:
            db (Session): The SQLAlchemy database session.
        """
        super().__init__(db)

    def create_user(self, username: str, password: str) -> User:
        """
        Creates a new user with the given username and password.

        Args:
            username (str): The username for the new user.
            password (str): The password for the new user.

        Returns:
            User: The newly created User object.
        """
        hashed_password = get_password_hash(password)
        return self.create(User, username=username, password=hashed_password)

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Retrieves a user by their username.

        Args:
            username (str): The username of the user to retrieve.

        Returns:
            Optional[User]: The User object if found, None otherwise.
        """
        return self.db.query(User).filter(User.username == username).first()

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticates a user with the given username and password.

        Args:
            username (str): The username of the user to authenticate.
            password (str): The password to verify.

        Returns:
            Optional[User]: The authenticated User object if successful, None otherwise.
        """
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def update_user(self, user_id: int, **user_data) -> User:
        """
        Updates a user's information.

        Args:
            user_id (int): The ID of the user to update.
            **user_data: Keyword arguments containing the updated user data.

        Returns:
            User: The updated User object.
        """
        if 'password' in user_data:
            user_data['password'] = get_password_hash(user_data['password'])
        return self.update(User, user_id, **user_data)

    def delete_user(self, user_id: int) -> None:
        """
        Deletes a user with the specified ID.

        Args:
            user_id (int): The ID of the user to delete.
        """
        self.delete(User, user_id)

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Retrieves a user by their ID.

        Args:
            user_id (int): The ID of the user to retrieve.

        Returns:
            Optional[User]: The User object if found, None otherwise.
        """
        return self.get_by_id(User, user_id)
    
    def checking_user_thread_access(self, user_id: int, thread_id: int) -> bool:
        """
        Checks if a user has access to a specific thread.

        Args:
            user_id (int): The ID of the user.
            thread_id (int): The ID of the thread.

        Returns:
            bool: True if the user has access to the thread, False otherwise.
        """
        return self.db.query(Thread).filter(Thread.thread_id == thread_id, Thread.user_id == user_id).first() is not None
