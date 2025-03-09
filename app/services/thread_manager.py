from typing import List, Optional
from sqlalchemy.orm import Session
from app.services.base_service import BaseService
from app.models.thread import Thread


class ThreadManager(BaseService):
    """
    Manages thread-related operations, including listing, creating,
    updating, and deleting threads.
    """

    def __init__(self, db: Session):
        """
        Initializes the ThreadManager with a database session.

        Args:
            db (Session): The SQLAlchemy database session.
        """
        super().__init__(db)

    def list_threads(self, user_id: int, offset: int = 0) -> List[Optional[Thread]]:
        """
        Retrieves a list of threads for a given user.

        Args:
            user_id (int): The ID of the user whose threads to retrieve.
            offset (int, optional): The number of threads to skip. Defaults to 0.

        Returns:
            List[Optional[Thread]]: A list of Thread objects, or an empty list if none found.
        """
        try:
            threads = (
                self.db.query(Thread)
                .filter(Thread.user_id == user_id)
                .order_by(Thread.created_at.desc())
                .offset(offset)
                .all()
            )
            return threads if threads else []
        except Exception as e:
            self.handle_error(e)

    def get_thread_by_id(self, thread_id: int) -> Thread:
        """
        Retrieves a specific thread by its ID.

        Args:
            thread_id (int): The ID of the thread to retrieve.

        Returns:
            Thread: The Thread object with the specified ID.
        """
        return self.get_by_id(Thread, thread_id)

    def create_thread(self, **thread_data) -> int:
        """
        Creates a new thread with the provided data.

        Args:
            **thread_data: Keyword arguments containing the thread data.

        Returns:
            uuid.UUID: The ID of the newly created thread.
        """
        return self.create(Thread, **thread_data).thread_id

    def update_thread(self, thread_id: int, **thread_data) -> Thread:
        """
        Updates an existing thread with the provided data.

        Args:
            thread_id (int): The ID of the thread to update.
            **thread_data: Keyword arguments containing the updated thread data.

        Returns:
            Thread: The updated Thread object.
        """
        return self.update(Thread, thread_id, **thread_data)

    def delete_thread(self, thread_id: int) -> None:
        """
        Deletes a thread with the specified ID.

        Args:
            thread_id (int): The ID of the thread to delete.
        """
        self.delete(Thread, thread_id)
