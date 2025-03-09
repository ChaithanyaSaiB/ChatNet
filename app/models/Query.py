from sqlalchemy import UUID, Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.query_relation import QueryRelation

class Query(Base):
    """
    Query Model:
    Represents a user's query and its associated AI response within a conversation thread.
    This model forms the core of the Q&A interaction system, linking users, threads, and search results.
    """
    __tablename__ = 'queries'  # Database table name

    # Primary key for unique query identification
    query_id = Column(Integer, primary_key=True)

    # Foreign key linking to the conversation thread
    thread_id = Column(Integer, ForeignKey('threads.thread_id'))

    # Foreign key linking to the user who made the query
    user_id = Column(Integer, ForeignKey('users.user_id'))

    # The actual text of the user's query
    query_text = Column(Text, nullable=False)

    # The AI-generated response to the query
    ai_response = Column(Text)

    # Current status of the query (e.g., "pending", "completed", "failed")
    status = Column(String(20))

    # Timestamp for when the query was created
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to the User model
    user = relationship("User", back_populates="queries")

    # Relationship to the Thread model
    thread = relationship("Thread", back_populates="queries")

    # Relationship to associated search results
    search_results = relationship("SearchResult", back_populates="query")

    # Self-referential relationships for query hierarchy
    parent_relations = relationship("QueryRelation", foreign_keys="QueryRelation.child_query_id", back_populates="child_query")
    child_relations = relationship("QueryRelation", foreign_keys="QueryRelation.parent_query_id", back_populates="parent_query")
