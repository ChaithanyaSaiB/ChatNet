from typing import Optional
from sqlalchemy.orm import Session
from app.services.base_service import BaseService
from app.models.user import User
from app.core.password_security import verify_password, get_password_hash

class UserManager(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def create_user(self, username: str, password: str) -> User:
        hashed_password = get_password_hash(password)
        return self.create(User, username=username, password=hashed_password)

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def update_user(self, user_id: int, **user_data) -> User:
        if 'password' in user_data:
            user_data['password'] = get_password_hash(user_data['password'])
        return self.update(User, user_id, **user_data)

    def delete_user(self, user_id: int) -> None:
        self.delete(User, user_id)

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.get_by_id(User, user_id)
