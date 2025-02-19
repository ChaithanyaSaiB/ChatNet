import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.services.base_service import BaseService
from app.models.thread import Thread  # Assuming you have a Thread model
from app.models.query import Query


class ThreadManager(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def list_threads(self, user_id: int, limit: int = 5, offset: int = 0) -> List[Optional[Thread]]:
        try:
            threads = (
                self.db.query(Thread)
                .filter(Thread.user_id == user_id)
                .order_by(Thread.created_at.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            return threads if threads else []
        except Exception as e:
            self.handle_error(e)

    def get_thread_by_id(self, thread_id: int) -> Thread:
        return self.get_by_id(Thread, thread_id)

    def create_thread(self, **thread_data) -> uuid.UUID:
        return self.create(Thread, **thread_data).thread_id

    def update_thread(self, thread_id: int, **thread_data) -> Thread:
        return self.update(Thread, thread_id, **thread_data)

    def delete_thread(self, thread_id: int) -> None:
        self.delete(Thread, thread_id)

    