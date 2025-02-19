from sqlalchemy import Column, BigInteger, String, Integer, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    threads = relationship("Thread", back_populates="user")
    queries = relationship("Query", back_populates="user")
