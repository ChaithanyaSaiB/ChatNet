from sqlalchemy import Column, BigInteger, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"  # Changed to lowercase plural
    user_id = Column(BigInteger, primary_key=True, index=True)  # Changed to snake_case
    username = Column(String(50), unique=True, nullable=False, index=True)  # Added index
    email = Column(String(120), unique=True, nullable=False, index=True)  # Added index
    password = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now())

    # Add relationships
    threads = relationship("Thread", back_populates="user")
    queries = relationship("Query", back_populates="user")
