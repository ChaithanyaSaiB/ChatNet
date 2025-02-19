from sqlalchemy import UUID, Column, Integer, BigInteger, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Thread(Base):
    __tablename__ = 'threads'

    thread_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="threads")
    queries = relationship("Query", back_populates="thread")
