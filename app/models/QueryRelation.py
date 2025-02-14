from sqlalchemy import Column, BigInteger, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class QueryRelation(Base):
    __tablename__ = "query_relations"  # Changed to plural for consistency
    relationship_id = Column(BigInteger, primary_key=True, index=True)
    parent_query_id = Column(BigInteger, ForeignKey('queries.query_id'), index=True)  # Corrected table and column name
    child_query_id = Column(BigInteger, ForeignKey('queries.query_id'), index=True)  # Corrected table and column name
    timestamp = Column(DateTime, default=func.now())

    # Optional: Add relationships for easier querying
    parent_query = relationship("Query", foreign_keys=[parent_query_id], back_populates="child_relations")
    child_query = relationship("Query", foreign_keys=[child_query_id], back_populates="parent_relations")
    
