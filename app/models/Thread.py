from sqlalchemy import Column, BigInteger, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Thread(Base):
    __tablename__ = "threads"  # Changed to plural for consistency
    thread_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey('users.user_id'), nullable=False, index=True)  # Changed to BigInteger, added ForeignKey
    title = Column(String(255), nullable=False)  # Added length constraint and made it non-nullable
    timestamp = Column(DateTime, default=func.now())

    # Add relationships
    user = relationship("User", back_populates="threads")
    queries = relationship("Query", back_populates="thread")
