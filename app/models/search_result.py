from sqlalchemy import Column, BigInteger, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SearchResult(Base):
    __tablename__ = "search_results"  # Changed to plural for consistency
    search_result_id = Column(BigInteger, primary_key=True, index=True)
    query_id = Column(BigInteger, ForeignKey('queries.query_id'), nullable=False, index=True)
    url = Column(String(2083), index=True)  # Changed from BigInteger to String, removed incorrect ForeignKey
    content = Column(Text)  # Changed from String to Text for potentially large content
    timestamp = Column(DateTime, default=func.now())

    # Add relationship
    query = relationship("Query", back_populates="search_results")
