from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Type, TypeVar, List, Any, Optional
from app.utils.api_error import APIError

T = TypeVar('T')

class BaseService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, model: Type[T], id: Any) -> T:
        try:
            instance = self.db.query(model).filter(model.id == id).first()
            if not instance:
                raise APIError(f"{model.__name__} with id {id} not found", status_code=404)
            return instance
        except SQLAlchemyError as e:
            self.handle_error(e)

    def create(self, model: Type[T], **kwargs) -> T:
        try:
            instance = model(**kwargs)
            self.db.add(instance)
            self.db.commit()
            self.db.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            self.handle_error(e)

    def update(self, model: Type[T], id: Any, **kwargs) -> T:
        try:
            instance = self.get_by_id(model, id)
            for key, value in kwargs.items():
                setattr(instance, key, value)
            self.db.commit()
            self.db.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            self.handle_error(e)

    def delete(self, model: Type[T], id: Any) -> None:
        try:
            instance = self.get_by_id(model, id)
            self.db.delete(instance)
            self.db.commit()
        except SQLAlchemyError as e:
            self.handle_error(e)

    def list_all(self, model: Type[T]) -> List[T]:
        try:
            return self.db.query(model).all()
        except SQLAlchemyError as e:
            self.handle_error(e)

    def handle_error(self, error: Exception):
        self.db.rollback()
        if isinstance(error, APIError):
            raise error
        else:
            raise APIError(f"Database error: {str(error)}", status_code=500)
