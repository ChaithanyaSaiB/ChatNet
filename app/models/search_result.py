from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SearchResult(Base):
    __tablename__ = 'search_results'

    search_result_id = Column(Integer, primary_key=True)
    query_id = Column(Integer, ForeignKey('queries.query_id'))
    url = Column(String(2048), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    query = relationship("Query", back_populates="search_results")
