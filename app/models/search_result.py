from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SearchResult(Base):
    """
    SearchResult Model:
    Represents individual search results associated with a specific query.
    This model stores URLs of relevant web pages or resources found in response to a user's query.
    """
    __tablename__ = 'search_results'  # Database table name

    # Primary key for unique search result identification
    search_result_id = Column(Integer, primary_key=True)

    # Foreign key linking to the associated query
    query_id = Column(Integer, ForeignKey('queries.query_id'))

    # URL of the search result (max length 2048 characters)
    url = Column(String(2048), nullable=False)

    # Timestamp for when the search result was created/found
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to the Query model
    query = relationship("Query", back_populates="search_results")
