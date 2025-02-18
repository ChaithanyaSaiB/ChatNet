from sqlalchemy import UUID, Column, BigInteger, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Thread(Base):
    __tablename__ = "threads"  # Changed to plural for consistency
    thread_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(BigInteger, ForeignKey('users.user_id'), nullable=False, index=True)  # Changed to BigInteger, added ForeignKey
    title = Column(String(255))  # Added length constraint and made it non-nullable
    timestamp = Column(DateTime, default=func.now())

    # Add relationships
    user = relationship("User", back_populates="threads")
    queries = relationship("Query", back_populates="thread")
