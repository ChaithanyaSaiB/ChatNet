from sqlalchemy import UUID, Column, Integer, BigInteger, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Thread(Base):
    """
    Thread Model:
    Represents a conversation thread that groups multiple queries made by a user.
    Each thread belongs to a specific user and contains metadata such as a title and creation timestamp.
    """
    __tablename__ = 'threads'  # Database table name

    # Primary key for unique thread identification
    thread_id = Column(Integer, primary_key=True)

    # Foreign key linking to the user who owns the thread
    user_id = Column(Integer, ForeignKey('users.user_id'))

    # Title of the thread (e.g., a descriptive label for the conversation)
    title = Column(String(255), nullable=False)

    # Timestamp for when the thread was created
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to the User model (owner of the thread)
    user = relationship("User", back_populates="threads")

    # Relationship to the Query model (queries within this thread)
    queries = relationship("Query", back_populates="thread")
