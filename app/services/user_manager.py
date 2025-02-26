import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.services.base_service import BaseService
from app.models.pydantic_models import TokenData
from app.models.user import User
from app.utils.password_security import verify_password, get_password_hash

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

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
    
    def get_current_user(self, token: str = Depends(oauth2_scheme)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, os.environ["SECRET_KEY"], algorithms=[os.environ["ALGORITHM"]])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
            token_data = TokenData(username=username)
        except JWTError:
            raise credentials_exception
        user = self.get_user_by_username(self.db, username=token_data.username)
        if user is None:
            raise credentials_exception
        return user
