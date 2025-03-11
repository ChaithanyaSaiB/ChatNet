from sqlalchemy import Column, BigInteger, String, Integer, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    """
    User Model:
    Represents a user in the system. Each user has a unique username and password 
    for authentication. This model also tracks the user's creation date and their 
    associated threads and queries.
    """
    __tablename__ = 'users'  # Database table name

    # Primary key for unique user identification
    user_id = Column(Integer, primary_key=True)

    # Unique username for user authentication
    username = Column(String(50), unique=True, nullable=False)

    # Hashed password for securing user accounts
    password = Column(String(255), nullable=False)

    # Timestamp for when the user account was created
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to the Thread model (threads created by this user)
    threads = relationship("Thread", back_populates="user")

    # Relationship to the Query model (queries made by this user)
    queries = relationship("Query", back_populates="user")
